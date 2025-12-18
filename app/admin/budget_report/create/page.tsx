"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, X, Upload, Plus, AlertCircle, Trash2, Save, Image as ImageIcon } from "lucide-react";
import { PrimaryButton, CancelButton } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/InputTextArea";
import SuccessModal from "@/app/components/ui/SuccessModal";

function CreateBudgetReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  // ถ้าไม่มี projectIdParam = Manual Mode (สร้างโครงการใหม่พร้อมรายงาน)
  const isManualMode = !projectIdParam;

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. ข้อมูลโครงการ
  const [projectData, setProjectData] = useState({
    projectName: "",
    responsibilityUnit: "",
    objective: "",
    requestedAmount: "",
    projectStartDate: "",
    projectEndDate: "",
    description: "",
    coverFilePath: "", // เก็บ URL หลังอัปโหลด หรือใช้แสดงผล
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null); // เก็บไฟล์จริงเพื่อรออัปโหลด

  // 2. ข้อมูลผู้รับผิดชอบ
  const [managerData, setManagerData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    position: "",
    phoneNumber: "",
    email: "",
  });

  // 3. ข้อมูลรายงานผล
  const [reportData, setReportData] = useState({
    actualExpense: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [activityImages, setActivityImages] = useState<File[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Styles ---
  const headerPillStyle = "w-full bg-[#F3F4F6] rounded-lg py-3 text-center mb-6 border border-gray-200 mt-8 first:mt-0";
  const headerTextStyle = "text-gray-600 font-semibold text-lg";
  const labelStyle = "block text-sm text-gray-600 mb-2 ml-4 font-medium";
  const errorTextStyle = "text-red-500 text-xs mt-1 ml-4 flex items-center animate-in fade-in slide-in-from-top-1";
  
  const getInputClass = (fieldName: string, isReadOnly: boolean = false) => {
    if (isReadOnly) return "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed focus:ring-0";
    return errors[fieldName] 
      ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
      : "border-gray-300 focus-visible:border-orange-500 focus-visible:ring-orange-500";
  };

  const formatFileSize = (size: number) => (size / 1024 / 1024).toFixed(2) + " MB";

  // --- Fetch Data (Linked Mode) ---
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectIdParam) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/project-proposal?id=${projectIdParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.proposal) {
            const p = data.proposal;
            // Fill Project Data
            setProjectData({
              projectName: p.projectName || "",
              responsibilityUnit: p.responsibilityUnit || "",
              objective: p.objective || "",
              requestedAmount: p.requestedAmount ? p.requestedAmount.toString() : "0",
              projectStartDate: p.projectStartDate ? p.projectStartDate.split("T")[0] : "",
              projectEndDate: p.projectEndDate ? p.projectEndDate.split("T")[0] : "",
              description: p.description || "",
              coverFilePath: p.coverFilePath || "",
            });
            if (p.coverFilePath) setCoverPreview(p.coverFilePath);

            // Fill Manager Data
            if (p.manager) {
              setManagerData({
                firstName: p.manager.firstName || "",
                lastName: p.manager.lastName || "",
                department: p.manager.department || "",
                position: p.manager.position || "",
                phoneNumber: p.manager.phoneNumber || "",
                email: p.manager.email || "",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectIdParam]);

  // --- Handlers ---
  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManagerData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  // --- File Upload Handlers ---
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCoverPreview(objectUrl);
      setCoverFile(file); // เก็บไฟล์ไว้รออัปโหลด
      clearError("coverFilePath");
    }
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
      clearError("evidenceFiles");
    }
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setActivityImages(prev => [...prev, ...Array.from(e.target.files || [])]);
      clearError("activityImages");
    }
  };

  const removeEvidence = (index: number) => setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  const removeImage = (index: number) => setActivityImages(prev => prev.filter((_, i) => i !== index));

  // --- Validation ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 1. Validate Project Data
    if (isManualMode) {
      if (!projectData.projectName.trim()) newErrors.projectName = "กรุณาระบุชื่อโครงการ";
      if (!projectData.responsibilityUnit.trim()) newErrors.responsibilityUnit = "กรุณาระบุหน่วยงาน";
      if (!projectData.objective.trim()) newErrors.objective = "กรุณาระบุวัตถุประสงค์";
      if (!projectData.requestedAmount || Number(projectData.requestedAmount) <= 0) newErrors.requestedAmount = "งบประมาณต้องมากกว่า 0";
      if (!projectData.projectStartDate) newErrors.projectStartDate = "ระบุวันเริ่ม";
      if (!projectData.projectEndDate) newErrors.projectEndDate = "ระบุวันสิ้นสุด";
    }

    // 2. Validate Manager Data
    if (isManualMode) {
        if (!managerData.firstName.trim()) newErrors.firstName = "ระบุชื่อ";
        if (!managerData.lastName.trim()) newErrors.lastName = "ระบุนามสกุล";
        if (!managerData.department.trim()) newErrors.department = "ระบุสังกัด";
        if (!managerData.position.trim()) newErrors.position = "ระบุตำแหน่ง";
        if (!managerData.phoneNumber.trim()) newErrors.phoneNumber = "ระบุเบอร์โทร";
        if (!managerData.email.trim()) newErrors.email = "ระบุอีเมล";
    }

    // 3. Validate Report Data
    if (!reportData.actualExpense) newErrors.actualExpense = "กรุณาระบุจำนวนเงินที่ใช้จ่ายจริง";
    if (evidenceFiles.length === 0) newErrors.evidenceFiles = "กรุณาแนบไฟล์หลักฐาน";
    if (activityImages.length < 2) newErrors.activityImages = "กรุณาแนบภาพกิจกรรมอย่างน้อย 2 ภาพ";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit Logic (Connected to API) ---
  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let targetProjectId = projectIdParam ? parseInt(projectIdParam) : null;

      // =========================================================
      // 1. กรณี Manual Mode: ต้องสร้างโครงการ (Project) ก่อน
      // =========================================================
      if (isManualMode) {
          // 1.1 อัปโหลดรูปปกก่อน (ถ้ามี)
          let uploadedCoverPath = "";
          if (coverFile) {
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            coverFormData.append('folder', 'budget/covers');
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: coverFormData
            });
            
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                uploadedCoverPath = uploadData.url;
            }
          }

          // 1.2 สร้างโครงการ
          const projectPayload = {
            project: {
              projectName: projectData.projectName,
              responsibilityUnit: projectData.responsibilityUnit,
              objective: projectData.objective,
              description: projectData.description,
              requestedAmount: Number(projectData.requestedAmount),
              projectStartDate: projectData.projectStartDate,
              projectEndDate: projectData.projectEndDate,
              coverFilePath: uploadedCoverPath,
              status: "APPROVED" // สร้างแล้วให้สถานะเป็น Approved เพื่อให้ทำรายงานได้เลย
            },
            manager: managerData
          };

          const projectRes = await fetch("/api/project-proposal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectPayload),
          });

          if (!projectRes.ok) {
            const err = await projectRes.json();
            throw new Error(err.error || "สร้างโครงการไม่สำเร็จ");
          }

          const projectJson = await projectRes.json();
          targetProjectId = projectJson.proposal.id; // ได้ ID โครงการมาแล้ว
      }

      // =========================================================
      // 2. สร้างรายงาน (Budget Report)
      // =========================================================
      if (!targetProjectId) {
          throw new Error("ไม่พบรหัสโครงการ");
      }

      const formData = new FormData();
      formData.append("projectId", targetProjectId.toString());
      formData.append("actualExpense", reportData.actualExpense);
      
      // ใส่ไฟล์เอกสาร
      evidenceFiles.forEach(file => {
        formData.append("evidenceFiles", file);
      });
      
      // ใส่รูปภาพกิจกรรม
      activityImages.forEach(file => {
        formData.append("activityImages", file);
      });

      const reportRes = await fetch("/api/budget-report", {
          method: "POST",
          body: formData // ไม่ต้องใส่ Content-Type (Browser จัดการ boundary เอง)
      });

      if (!reportRes.ok) {
          const err = await reportRes.json();
          throw new Error(err.error || "บันทึกรายงานไม่สำเร็จ");
      }

      setShowSuccessModal(true);

    } catch (error) {
      console.error("Submission error:", error);
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push("/admin/budget_report");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      <SuccessModal
        show={showSuccessModal}
        onClose={handleModalClose}
        message="บันทึกรายงานเรียบร้อยแล้ว"
      />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-700 mt-4 mb-8 text-center">
          {isManualMode ? "สร้างรายงานโครงการ (โครงการใหม่)" : "เพิ่มรายงานโครงการ"}
        </h1>

        {/* ================= SECTION 1: ข้อมูลโครงการ ================= */}
        <div className={headerPillStyle}>
          <h2 className={headerTextStyle}>ส่วนที่ 1: ข้อมูลโครงการ</h2>
        </div>

        <div className="space-y-6 px-0 mb-10">
          <div>
            <label className={labelStyle}>ชื่อโครงการ <span className="text-red-500">*</span></label>
            <Input
              name="projectName"
              value={projectData.projectName}
              onChange={handleProjectChange}
              readOnly={!isManualMode}
              radius="md"
              className={getInputClass("projectName", !isManualMode)}
              placeholder="ระบุชื่อโครงการ"
            />
            {errors.projectName && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.projectName}</p>}
          </div>

          <div>
            <label className={labelStyle}>ชื่อหน่วยงาน/องค์กร <span className="text-red-500">*</span></label>
            <Input
              name="responsibilityUnit"
              value={projectData.responsibilityUnit}
              onChange={handleProjectChange}
              readOnly={!isManualMode}
              radius="md"
              className={getInputClass("responsibilityUnit", !isManualMode)}
              placeholder="ระบุหน่วยงาน"
            />
             {errors.responsibilityUnit && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.responsibilityUnit}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className={labelStyle}>วัตถุประสงค์ <span className="text-red-500">*</span></label>
                <Input
                    name="objective"
                    value={projectData.objective}
                    onChange={handleProjectChange}
                    readOnly={!isManualMode}
                    radius="md"
                    className={getInputClass("objective", !isManualMode)}
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
                <label className={labelStyle}>งบประมาณที่ขอตั้งต้น (บาท) <span className="text-red-500">*</span></label>
                <Input
                    type="number"
                    name="requestedAmount"
                    value={projectData.requestedAmount}
                    onChange={handleProjectChange}
                    readOnly={!isManualMode}
                    radius="md"
                    className={getInputClass("requestedAmount", !isManualMode)}
                    placeholder="0.00"
                />
                {errors.requestedAmount && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.requestedAmount}</p>}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className={labelStyle}>วันเริ่มโครงการ <span className="text-red-500">*</span></label>
                <Input
                    type="date"
                    name="projectStartDate"
                    value={projectData.projectStartDate}
                    onChange={handleProjectChange}
                    readOnly={!isManualMode}
                    radius="md"
                    className={getInputClass("projectStartDate", !isManualMode)}
                />
                {errors.projectStartDate && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.projectStartDate}</p>}
            </div>
            <div>
                <label className={labelStyle}>วันสิ้นสุดโครงการ <span className="text-red-500">*</span></label>
                <Input
                    type="date"
                    name="projectEndDate"
                    value={projectData.projectEndDate}
                    onChange={handleProjectChange}
                    readOnly={!isManualMode}
                    radius="md"
                    className={getInputClass("projectEndDate", !isManualMode)}
                />
                {errors.projectEndDate && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.projectEndDate}</p>}
            </div>
          </div>

          <div>
            <label className={labelStyle}>รายละเอียดเพิ่มเติม</label>
            <Textarea
                name="description"
                value={projectData.description}
                onChange={handleProjectChange}
                readOnly={!isManualMode}
                className={`rounded-2xl min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 focus:border-gray-400 ${getInputClass("description", !isManualMode)}`}
                placeholder="สำหรับกรอกข้อมูลเพิ่มเติม เช่น หลักการและเหตุผลของโครงการ สามารถเว้นว่างได้หรือไม่เกิน 500 ตัวอักษร"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
                {projectData.description ? projectData.description.length : 0} / 500 ตัวอักษร
            </div>
          </div>

          {/* ================= ส่วนอัปโหลดภาพปก ================= */}
          {(isManualMode || coverPreview) && (
              <div>
                <label className={labelStyle}>ภาพปกโครงการ {isManualMode && <span className="text-gray-400 font-normal">(ถ้ามี)</span>}</label>
                
                <div className={`mt-2 border-2 border-dashed rounded-xl p-6 transition-colors h-64 flex flex-col items-center justify-center relative overflow-hidden bg-white ${isManualMode ? 'cursor-pointer hover:border-orange-300' : 'border-gray-200'}`}>
                    
                    {coverPreview ? (
                        <>
                            <img src={coverPreview} alt="Cover" className="w-full h-full object-contain z-10" />
                            {isManualMode && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); }}
                                    className="absolute top-4 right-4 bg-white/80 p-2 rounded-lg text-red-500 shadow-sm hover:bg-red-50 z-20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer group w-full h-full">
                            <div className="p-4 rounded-full mb-3 transition-transform group-hover:scale-110 bg-orange-50 text-orange-500">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">
                                คลิกเพื่ออัปโหลดภาพปก
                            </span>
                            <span className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleCoverUpload} 
                                disabled={!isManualMode}
                            />
                        </label>
                    )}
                </div>
              </div>
          )}
        </div>


        {/* ================= SECTION 2: ข้อมูลผู้รับผิดชอบ ================= */}
        <div className={headerPillStyle}>
          <h2 className={headerTextStyle}>ส่วนที่ 2: ข้อมูลผู้รับผิดชอบโครงการ</h2>
        </div>

        <div className="space-y-6 px-0 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelStyle}>ชื่อ <span className="text-red-500">*</span></label>
                    <Input
                        name="firstName"
                        value={managerData.firstName}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("firstName", !isManualMode)}
                    />
                    {errors.firstName && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.firstName}</p>}
                </div>
                <div>
                    <label className={labelStyle}>นามสกุล <span className="text-red-500">*</span></label>
                    <Input
                        name="lastName"
                        value={managerData.lastName}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("lastName", !isManualMode)}
                    />
                    {errors.lastName && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.lastName}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelStyle}>สังกัด/หน่วยงาน <span className="text-red-500">*</span></label>
                    <Input
                        name="department"
                        value={managerData.department}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("department", !isManualMode)}
                    />
                     {errors.department && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.department}</p>}
                </div>
                <div>
                    <label className={labelStyle}>ตำแหน่ง <span className="text-red-500">*</span></label>
                    <Input
                        name="position"
                        value={managerData.position}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("position", !isManualMode)}
                    />
                     {errors.position && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.position}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelStyle}>เบอร์โทรติดต่อ <span className="text-red-500">*</span></label>
                    <Input
                        name="phoneNumber"
                        value={managerData.phoneNumber}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("phoneNumber", !isManualMode)}
                    />
                     {errors.phoneNumber && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.phoneNumber}</p>}
                </div>
                <div>
                    <label className={labelStyle}>อีเมล <span className="text-red-500">*</span></label>
                    <Input
                        name="email"
                        value={managerData.email}
                        onChange={handleManagerChange}
                        readOnly={!isManualMode}
                        radius="md"
                        className={getInputClass("email", !isManualMode)}
                    />
                     {errors.email && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.email}</p>}
                </div>
            </div>
        </div>


        {/* ================= SECTION 3: รายงานผล ================= */}
        <div className={headerPillStyle}>
          <h2 className={headerTextStyle}>ส่วนที่ 3: รายงานการใช้จ่ายและหลักฐาน</h2>
        </div>

        <div className="space-y-8 px-0">
          {/* จำนวนเงิน */}
          <div>
            <label className={labelStyle}>
              จำนวนเงินที่ใช้จ่ายตามจริง <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-md">
              <Input
                type="number"
                name="actualExpense"
                value={reportData.actualExpense}
                onChange={handleReportChange}
                radius="md"
                className={`w-full text-md pr-12 ${getInputClass("actualExpense")}`}
                placeholder="ระบุจำนวนเงิน"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
                บาท
              </span>
            </div>
            {errors.actualExpense && (
              <p className={errorTextStyle}>
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.actualExpense}
              </p>
            )}
          </div>

          {/* Upload เอกสาร */}
          <div>
            <label className={labelStyle}>
              แนบหลักฐานการใช้จ่าย <span className="text-gray-400 font-normal">(เช่น ใบเสร็จ, เอกสารสรุป)</span> <span className="text-red-500">*</span>
            </label>

            <div className={`mt-2 border-2 border-dashed rounded-xl p-6 transition-colors ${errors.evidenceFiles ? 'border-red-300 bg-red-50/10' : 'border-gray-200 hover:border-orange-300'}`}>
              
              {/* File List */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-3 mb-6">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeEvidence(idx)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <label className="flex flex-col items-center justify-center cursor-pointer group">
                <div className={`p-4 rounded-full mb-3 transition-transform group-hover:scale-110 ${errors.evidenceFiles ? 'bg-red-50 text-red-400' : 'bg-orange-50 text-orange-500'}`}>
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">
                  คลิกเพื่อเพิ่มไฟล์เอกสาร
                </span>
                <span className="text-xs text-gray-400 mt-1">รองรับ PDF, DOCX</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleEvidenceUpload}
                />
              </label>
            </div>
            {errors.evidenceFiles && evidenceFiles.length === 0 && (
              <p className={errorTextStyle}>
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.evidenceFiles}
              </p>
            )}
          </div>

          {/* Upload รูปภาพ */}
          <div className="pb-4">
            <label className={labelStyle}>
              แนบภาพกิจกรรม <span className="text-gray-400 font-normal">(อย่างน้อย 2 ภาพ)</span> <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
              {activityImages.map((file, idx) => (
                <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 shadow-sm group bg-gray-50">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm transform scale-90 group-hover:scale-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className={`flex flex-col items-center justify-center aspect-4/3 border-2 border-dashed rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all group bg-white ${errors.activityImages ? 'border-red-300' : 'border-gray-300'}`}>
                <div className="bg-gray-50 p-3 rounded-full mb-2 group-hover:bg-white transition-colors shadow-sm">
                  <Plus className={`w-5 h-5 ${errors.activityImages ? 'text-red-400' : 'text-gray-400 group-hover:text-orange-500'}`} />
                </div>
                <span className={`text-xs font-medium ${errors.activityImages ? 'text-red-400' : 'text-gray-500 group-hover:text-orange-600'}`}>
                  เพิ่มรูปภาพ
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                />
              </label>
            </div>
            {errors.activityImages && (
              <p className={errorTextStyle}>
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.activityImages}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-8 pb-10 gap-4 mt-8 border-t border-gray-100">
          <CancelButton
            type="button"
            onClick={() => router.back()}
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
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                กำลังบันทึก...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> บันทึก
              </span>
            )}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function CreateBudgetReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <CreateBudgetReportForm />
    </Suspense>
  );
}