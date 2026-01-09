"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search as SearchIcon, CloudUpload, X } from "lucide-react";
import { ProjectManager } from "@/app/types/budget_approval";

// เรียกใช้ Components
import { Input } from "@/app/components/ui/Input";
import { InputIcon } from "@/app/components/ui/InputIcon";
import { Textarea } from "@/app/components/ui/InputTextArea";
import { CancelButton, PrimaryButton } from "@/app/components/ui/Button";
import SuccessModal from "@/app/components/ui/SuccessModal";

export default function EditBudgetProjectPage() {
  const router = useRouter();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // IDs
  const [staffId, setStaffId] = useState<number | null>(null);
  const [budgetRoundId, setBudgetRoundId] = useState<number | null>(null);

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Step 1: Project Data ---
  const [projectData, setProjectData] = useState({
    projectName: "",
    responsibilityUnit: "",
    objective: "",
    requestedAmount: 0,
    projectStartDate: "",
    projectEndDate: "",
    description: "",
    coverFilePath: "",
  });
  const [coverFilePreview, setCoverFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Step 2: Manager Data ---
  const [managerData, setManagerData] = useState({
    id: null as number | null,
    firstName: "",
    lastName: "",
    department: "",
    position: "",
    phoneNumber: "",
    email: "",
  });

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ProjectManager[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Styles
  const headerPillStyle =
    "w-full bg-[#F3F4F6] rounded-lg py-3 text-center mb-6 border border-gray-200";
  const headerTextStyle = "text-gray-600 font-semibold text-lg";
  const labelStyle = "block text-sm text-gray-600 mb-2 ml-4 font-medium";

  const getInputClass = (fieldName: string) => {
    const baseClass =
      "border-gray-300 focus-visible:border-orange-500 focus-visible:ring-orange-500";
    const errorClass =
      "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500";
    return errors[fieldName] ? errorClass : baseClass;
  };

  // ✅ Fetch Existing Data
  useEffect(() => {
    if (!id) return;

    fetch(`/api/project-proposal?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.proposal) {
          const p = data.proposal;

          setStaffId(p.staffId);
          setBudgetRoundId(p.budgetRoundId);

          setProjectData({
            projectName: p.projectName || "",
            responsibilityUnit: p.responsibilityUnit || "",
            objective: p.objective || "",
            requestedAmount: p.requestedAmount || 0,
            projectStartDate: p.projectStartDate ? p.projectStartDate.split("T")[0] : "",
            projectEndDate: p.projectEndDate ? p.projectEndDate.split("T")[0] : "",
            description: p.description || "",
            coverFilePath: p.coverFilePath || "",
          });

          if (p.coverFilePath) {
            setCoverFilePreview(p.coverFilePath);
          }

          if (p.manager) {
            setManagerData({
              id: p.manager.id || null,
              firstName: p.manager.firstName || "",
              lastName: p.manager.lastName || "",
              department: p.manager.department || "",
              position: p.manager.position || "",
              phoneNumber: p.manager.phoneNumber || "",
              email: p.manager.email || "",
            });
          }
        }
      })
      .catch((err) => console.error("Failed to fetch project:", err));
  }, [id]);

  // --- Handlers ---
  const handleProjectChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManagerData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  // ✅ New Upload Logic
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "budget/upload");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      setProjectData((prev) => ({ ...prev, coverFilePath: data.url }));
      setCoverFilePreview(data.url);

      if (errors.coverFilePath) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n.coverFilePath;
          return n;
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("อัปโหลดรูปภาพไม่สำเร็จ: " + (error as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // --- Search Logic (Updated) ---
  const executeSearch = async (query: string) => {
    if (!query.trim()) {
        setSearchResult([]);
        return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/project-manager?q=${query}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      }
    } catch (error) {
      console.error("Error searching manager:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        executeSearch(searchQuery);
      } else {
        setSearchResult([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(searchQuery);
    }
  };

  const handleManualSearch = () => {
    executeSearch(searchQuery);
  };

  const handleSelectManager = (manager: ProjectManager) => {
    setManagerData({
      id: manager.id ?? null,
      firstName: manager.firstName,
      lastName: manager.lastName,
      department: manager.department ?? "",
      position: manager.position ?? "",
      phoneNumber: manager.phoneNumber ?? "",
      email: manager.email ?? "",
    });
    setSearchResult([]);
    setSearchQuery("");
  };

  // --- Validation ---
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!projectData.projectName.trim()) newErrors.projectName = "กรุณาระบุชื่อโครงการ";
    if (!projectData.responsibilityUnit.trim()) newErrors.responsibilityUnit = "กรุณาระบุหน่วยงาน";
    if (!projectData.objective.trim()) newErrors.objective = "กรุณาระบุวัตถุประสงค์";
    if (!projectData.requestedAmount || Number(projectData.requestedAmount) <= 0)
      newErrors.requestedAmount = "งบประมาณต้องมากกว่า 0";

    if (!projectData.projectStartDate) {
      newErrors.projectStartDate = "กรุณาระบุวันเริ่มต้น";
    } 

    if (!projectData.projectEndDate) {
      newErrors.projectEndDate = "กรุณาระบุวันสิ้นสุด";
    } else if (
      projectData.projectStartDate &&
      projectData.projectEndDate < projectData.projectStartDate
    ) {
      newErrors.projectEndDate = "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น";
    }
    if (!projectData.coverFilePath) newErrors.coverFilePath = "กรุณาเพิ่มรูปภาพปกโครงการ";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!managerData.firstName.trim()) newErrors.firstName = "กรุณาระบุชื่อ";
    if (!managerData.lastName.trim()) newErrors.lastName = "กรุณาระบุนามสกุล";
    if (!managerData.department.trim()) newErrors.department = "กรุณาระบุสังกัด";
    if (!managerData.position.trim()) newErrors.position = "กรุณาระบุตำแหน่ง";
    if (!managerData.phoneNumber.trim()) newErrors.phoneNumber = "กรุณาระบุเบอร์โทร";
    if (!managerData.email.trim()) newErrors.email = "กรุณาระบุอีเมล";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Navigation & Submit ---
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        id: id,
        ...projectData,
        requestedAmount: Number(projectData.requestedAmount),
        staffId: staffId,
        budgetRoundId: budgetRoundId,
        manager: {
            ...managerData,
            id: managerData.id ?? null,
        }
      };

      const response = await fetch("/api/project-proposal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("บันทึกข้อมูลไม่สำเร็จ: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push("/admin/budget_approval");
  };

  if (!id) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      <SuccessModal
        show={showSuccessModal}
        onClose={handleModalClose}
        message="บันทึกการแก้ไขโครงการเรียบร้อยแล้ว"
      />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-700 mt-4 mb-8 pl-1 text-center">
          แก้ไขโครงการ
        </h1>

        {/* === STEP 1: ข้อมูลโครงการ === */}
        {step === 1 && (
          <div>
            <div className={headerPillStyle}>
              <h2 className={headerTextStyle}>รายละเอียดโครงการ</h2>
            </div>

            <div className="space-y-6 px-0">
              {/* Project Name */}
              <div>
                <label className={labelStyle}>
                  ชื่อโครงการ <span className="text-red-500">*</span>
                </label>
                <Input
                  name="projectName"
                  value={projectData.projectName}
                  onChange={handleProjectChange}
                  radius="md"
                  className={getInputClass("projectName")}
                  placeholder="เช่น โครงการทุนการศึกษาวิศวกรรมศาสตร์ ภาค 1/2568"
                />
                {errors.projectName && (
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectName}</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className={labelStyle}>
                  ชื่อหน่วยงาน/องค์กร <span className="text-red-500">*</span>
                </label>
                <Input
                  name="responsibilityUnit"
                  value={projectData.responsibilityUnit}
                  onChange={handleProjectChange}
                  radius="md"
                  className={getInputClass("responsibilityUnit")}
                  placeholder="เช่น สำนักวิชาวิศวกรรมศาสตร์"
                />
                {errors.responsibilityUnit && (
                  <p className="text-red-500 text-xs mt-1 ml-4">{errors.responsibilityUnit}</p>
                )}
              </div>

              {/* Grid: Objective & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    วัตถุประสงค์ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="objective"
                    value={projectData.objective}
                    onChange={handleProjectChange}
                    radius="md"
                    maxLength={100}
                    className={getInputClass("objective")}
                    placeholder="เช่น เพื่อสนับสนุนทุนการศึกษาให้แก่นักศึกษาที่ขาดแคลน"
                  />
                  <div className="flex justify-between items-start mt-1">
                    <div className="flex-1">
                      {errors.objective && (
                        <p className="text-red-500 text-xs ml-4">{errors.objective}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap ml-2">
                      {projectData.objective ? projectData.objective.length : 0} / 100 ตัวอักษร
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>
                    งบประมาณที่ขอ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="requestedAmount"
                    value={projectData.requestedAmount}
                    onChange={handleProjectChange}
                    radius="md"
                    className={getInputClass("requestedAmount")}
                    min="0"
                    placeholder="0.00"
                  />
                  {errors.requestedAmount && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.requestedAmount}</p>
                  )}
                </div>
              </div>

              {/* Grid: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    วันเริ่มจัดโครงการ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="projectStartDate"
                    value={projectData.projectStartDate}
                    onChange={handleProjectChange}
                    radius="md"
                    className={`cursor-pointer ${getInputClass("projectStartDate")}`}
                  />
                  {errors.projectStartDate && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectStartDate}</p>
                  )}
                </div>
                <div>
                  <label className={labelStyle}>
                    วันสิ้นสุดโครงการ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="projectEndDate"
                    value={projectData.projectEndDate}
                    onChange={handleProjectChange}
                    radius="md"
                    min={projectData.projectStartDate || undefined}
                    className={`cursor-pointer ${getInputClass("projectEndDate")}`}
                  />
                  {errors.projectEndDate && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectEndDate}</p>
                  )}
                </div>
              </div>
              {/* Description */}
              <div>
                <label className={labelStyle}>รายละเอียดเพิ่มเติม</label>
                <Textarea
                  name="description"
                  value={projectData.description}
                  onChange={handleProjectChange}
                  maxLength={500}
                  className={`rounded-2xl min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 focus:border-gray-400 ${getInputClass("description")}`}
                  placeholder="สำหรับกรอกข้อมูลเพิ่มเติม"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {projectData.description ? projectData.description.length : 0} / 500 ตัวอักษร
                </div>
              </div>

              {/* ✅ Upload Image Section (Updated UI) */}
              <div>
                <label className={labelStyle}>
                  ภาพปก/ภาพโปสเตอร์กิจกรรม <span className="text-red-500">*</span>
                </label>
                
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => !coverFilePreview && fileInputRef.current?.click()}
                    className={`mt-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all h-64 relative overflow-hidden bg-white
                    ${isDragging ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'} 
                    ${errors.coverFilePath ? 'border-red-300 bg-red-50/10' : ''}
                    ${!coverFilePreview ? 'cursor-pointer' : ''}
                    `}
                >
                    {coverFilePreview ? (
                        <>
                            <img src={coverFilePreview} alt="Cover Preview" className="w-full h-full object-contain z-10" />
                            <button
                                type="button"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setCoverFilePreview(null); 
                                    setProjectData(p => ({ ...p, coverFilePath: "" }));
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-gray-500 hover:text-red-500 shadow-md transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <CloudUpload className={`w-12 h-12 mb-3 ${errors.coverFilePath ? 'text-red-300' : 'text-gray-300'}`} />
                            <p className="text-gray-700 font-medium mb-1">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่</p>
                            <p className="text-gray-400 text-xs mb-4">รองรับไฟล์ภาพ JPEG, PNG ขนาดไม่เกิน 5 MB</p>
                            <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm pointer-events-none">
                              เลือกภาพ
                            </button>
                        </>
                    )}
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                    />
                </div>
                
                {errors.coverFilePath && (
                  <p className="text-red-500 text-xs mt-2 ml-1 animate-in slide-in-from-top-1">
                    {errors.coverFilePath}
                  </p>
                )}
              </div>

              {/* Buttons Step 1 */}
              <div className="flex justify-end pt-8 pb-10 gap-4">
                <CancelButton
                  type="button"
                  onClick={() => router.back()}
                  style={{ borderRadius: "8px", width: "140px", height: "40px" }}
                >
                  ยกเลิก
                </CancelButton>
                <PrimaryButton
                  type="button"
                  onClick={handleNext}
                  style={{ borderRadius: "8px", width: "140px", height: "40px" }}
                >
                  ถัดไป
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* === STEP 2: ข้อมูลผู้รับผิดชอบ === */}
        {step === 2 && (
          <div>
            <div className={headerPillStyle}>
              <h2 className={headerTextStyle}>รายละเอียดผู้รับผิดชอบโครงการ</h2>
            </div>
            <div className="space-y-6 px-0">
              {/* Search Box */}
              <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full">
                    <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                      ค้นหาผู้รับผิดชอบเดิม (เพื่อแทนที่)
                    </label>
                    <InputIcon
                      icon={SearchIcon}
                      iconPosition="left"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown} 
                      placeholder="พิมพ์ชื่อ หรืออีเมล..."
                      radius="md"
                      className="bg-white"
                    />
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={handleManualSearch} 
                    disabled={isSearching}
                    className="mb-0.5"
                    style={{ borderRadius: "8px", width: "auto", minWidth: "100px", height: "40px" }}
                  >
                    {isSearching ? "..." : "ค้นหา"}
                  </PrimaryButton>
                </div>
                {/* Search Result */}
                {searchResult.length > 0 && (
                  <div className="mt-3 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {searchResult.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectManager(m)}
                        className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors px-6"
                      >
                        <div>
                          <div className="font-semibold text-gray-700">
                            {m.firstName} {m.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          {m.department || "ไม่ระบุหน่วยงาน"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields Step 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="firstName"
                    value={managerData.firstName}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className={labelStyle}>
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="lastName"
                    value={managerData.lastName}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    สังกัด/หน่วยงาน <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="department"
                    value={managerData.department}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("department")}
                  />
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.department}</p>
                  )}
                </div>
                <div>
                  <label className={labelStyle}>
                    ตำแหน่ง/แผนก <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="position"
                    value={managerData.position}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("position")}
                  />
                  {errors.position && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.position}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    เบอร์โทรติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phoneNumber"
                    value={managerData.phoneNumber}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("phoneNumber")}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className={labelStyle}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="email"
                    value={managerData.email}
                    onChange={handleManagerChange}
                    radius="md"
                    className={getInputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-4">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Buttons Step 2 */}
              <div className="flex justify-end pt-8 pb-10 gap-4">
                <CancelButton
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ borderRadius: "8px", width: "140px", height: "40px" }}
                >
                  ย้อนกลับ
                </CancelButton>
                <PrimaryButton
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{ borderRadius: "8px", width: "140px", height: "40px" }}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}