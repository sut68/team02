"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Search as SearchIcon } from "lucide-react"; // แก้ import ให้กระชับ
import { ProjectProposal, ProjectManager } from "@/app/types/budget_approval";

// เรียกใช้ Components
import { Input } from "@/app/components/ui/Input";
import { InputIcon } from "@/app/components/ui/InputIcon";
import { Textarea } from "@/app/components/ui/InputTextArea";
import { CancelButton, PrimaryButton } from "@/app/components/ui/Button";
import SuccessModal from "@/app/components/ui/SuccessModal";

export default function CreateBudgetProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Fetch IDs
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

  // ✅ FIX: ใช้ Local Time แทน UTC เพื่อป้องกันบั๊กวันที่ผิดเพี้ยนตอนเช้า
  const getTodayString = () => {
    const date = new Date();
    // ปรับ Format เป็น YYYY-MM-DD แบบ Local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // 1.1 ดึง User ID
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setStaffId(data.id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    // 1.2 ดึงรอบงบประมาณปัจจุบัน
    const fetchActiveRound = async () => {
      try {
        const res = await fetch("/api/budget-round");
        if (res.ok) {
          const data = await res.json();
          const rounds = data.budgetRounds || [];
          const now = new Date();
          
          // หา active round ที่วันนี้อยู่ระหว่าง startDate และ endDate
          const active = rounds.find((r: any) => {
            if (!r.startDate || !r.endDate) return false;
            const start = new Date(r.startDate);
            const end = new Date(r.endDate);
            return now >= start && now <= end;
          });

          if (active) {
            setBudgetRoundId(active.id);
            console.log("Active Budget Round ID:", active.id);
          } else {
            console.warn("No active budget round found.");
          }
        }
      } catch (err) {
        console.error("Error fetching budget rounds:", err);
      }
    };

    fetchUser();
    fetchActiveRound();
  }, []);

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
    setManagerData((prev) => ({ ...prev, [name]: value, id: null }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  // --- Search Logic ---
  const handleSearchManager = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/project-manager?q=${searchQuery}`);
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
    const todayStr = getTodayString();

    if (!projectData.projectName.trim()) newErrors.projectName = "กรุณาระบุชื่อโครงการ";
    if (!projectData.responsibilityUnit.trim()) newErrors.responsibilityUnit = "กรุณาระบุหน่วยงาน";
    if (!projectData.objective.trim()) newErrors.objective = "กรุณาระบุวัตถุประสงค์";
    if (!projectData.requestedAmount || Number(projectData.requestedAmount) <= 0)
      newErrors.requestedAmount = "งบประมาณต้องมากกว่า 0";

    if (!projectData.projectStartDate) {
      newErrors.projectStartDate = "กรุณาระบุวันเริ่มต้น";
    } else if (projectData.projectStartDate < todayStr) {
      newErrors.projectStartDate = "วันเริ่มโครงการต้องไม่เป็นวันที่ผ่านมาแล้ว";
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
      // ✅ 2. ส่ง staffId และ budgetRoundId ไปด้วย
      const payload = {
        project: {
          ...projectData,
          requestedAmount: Number(projectData.requestedAmount),
          staffId: staffId,           // ส่ง ID คนทำรายการ
          budgetRoundId: budgetRoundId, // ส่ง ID รอบงบประมาณปัจจุบัน
        },
        manager: {
          ...managerData,
          id: managerData.id ?? null,
        },
      };

      const response = await fetch("/api/project-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
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

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      <SuccessModal
        show={showSuccessModal}
        onClose={handleModalClose}
        message="บันทึกข้อมูลโครงการเรียบร้อยแล้ว"
      />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-700 mt-4 mb-8 pl-1 text-center">
          เพิ่มโครงการ
        </h1>

        {!budgetRoundId && !isSearching && (
           <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm text-center">
             ⚠️ ขณะนี้ไม่มีรอบงบประมาณที่เปิดใช้งาน โครงการจะถูกบันทึกโดยไม่มีรอบงบประมาณ
           </div>
        )}

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
                  {/* ✅ ส่วน Error + ตัวนับคำ: จัดให้อยู่บรรทัดเดียวกัน */}
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
                  {/* ✅ FIX: เปลี่ยนจาก InputIcon เป็น Input ธรรมดา (เหมือน End Date) */}
                  <Input
                    type="date"
                    name="projectStartDate"
                    value={projectData.projectStartDate}
                    onChange={handleProjectChange}
                    radius="md"
                    min={getTodayString()}
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
                    min={projectData.projectStartDate || getTodayString()}
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
                  placeholder="สำหรับกรอกข้อมูลเพิ่มเติม เช่น หลักการและเหตุผลของโครงการ สามารถเว้นว่างได้หรือไม่เกิน 500 ตัวอักษร"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {projectData.description ? projectData.description.length : 0} / 500 ตัวอักษร
                </div>
              </div>

              {/* Upload */}
              <div>
                <label className={labelStyle}>
                  ภาพปก/ภาพโปสเตอร์กิจกรรม <span className="text-red-500">*</span>
                </label>
                <div
                  className={`mt-2 border rounded-2xl h-64 flex flex-col items-center justify-center relative overflow-hidden bg-white hover:bg-orange-50 transition-colors cursor-pointer ${
                    errors.coverFilePath
                      ? "border-red-500 border-2"
                      : "border-gray-300 border-dashed hover:border-orange-500"
                  }`}
                >
                  {coverFilePreview ? (
                    <>
                      <img
                        src={coverFilePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverFilePreview(null);
                          setProjectData((p) => ({ ...p, coverFilePath: "" }));
                        }}
                        className="absolute top-4 right-4 bg-white/80 rounded-lg p-2 shadow-md hover:bg-red-50 text-red-500 z-10 text-xs font-bold px-3"
                      >
                        ลบรูปภาพ
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <div className="mb-6">
                        <ImageUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-[14px] font-medium">
                        คลิกเพื่ออัปโหลดรูปภาพ
                      </span>
                      <span className="text-gray-400 text-xs mt-2">(รองรับ jpg, png, gif)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                </div>
                <div className="flex justify-between items-start mt-2 px-1">
                  <div className="flex-1 text-left">
                    {errors.coverFilePath && (
                      <p className="text-red-500 text-xs animate-in slide-in-from-top-1">
                        {errors.coverFilePath}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 ml-2">
                    ขนาดไฟล์ไม่เกิน 5MB
                  </div>
                </div>
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
                      ค้นหาผู้รับผิดชอบเดิม (ถ้ามี)
                    </label>
                    <InputIcon
                      icon={SearchIcon}
                      iconPosition="left"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="พิมพ์ชื่อ หรืออีเมล..."
                      radius="md"
                      className="bg-white"
                    />
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={handleSearchManager}
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