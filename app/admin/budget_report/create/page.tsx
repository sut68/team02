'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, X, CloudUpload, Upload, Plus, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { PrimaryButton, CancelButton } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/InputTextArea';

// --- Type ข้อมูลโครงการ ---
interface ApprovedProject {
  id: number;
  projectName: string;
  organization: string;
  objective: string;
  requestedBudget: number;
  startDate: string;
  endDate: string;
  description: string;
}

// --- Mock Database ---
const mockProjectsDB: Record<number, ApprovedProject> = {
  101: {
    id: 101,
    projectName: "โครงการทุนการศึกษา ภาค 1/2568",
    organization: "สำนักวิชาวิศวกรรมศาสตร์",
    objective: "เพื่อมอบโอกาสต่อยอดทางการเรียนให้กับนักศึกษา",
    requestedBudget: 25500,
    startDate: "2025-11-01", 
    endDate: "2025-11-07",
    description: "มอบทุนการศึกษาแก่นักศึกษาที่มีผลการเรียนดี จำนวน 1 ทุน/สาขาวิชา ทุนละ 1,500 บาท"
  },
  102: {
    id: 102,
    projectName: "โครงการอบรมเชิงปฏิบัติการ IoT",
    organization: "สาขาวิศวกรรมคอมพิวเตอร์",
    objective: "เพื่อเพิ่มพูนทักษะด้าน Internet of Things",
    requestedBudget: 50000,
    startDate: "2025-12-15",
    endDate: "2025-12-20",
    description: "อบรมการใช้งานบอร์ด ESP32 และการเชื่อมต่อ Cloud Platform เบื้องต้น"
  }
};

function CreateBudgetReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  // State
  const [formData, setFormData] = useState({
    projectName: '', organization: '', objective: '', requestedBudget: '', 
    startDate: '', endDate: '', description: '', actualExpense: ''
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [activityImages, setActivityImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill Data
  useEffect(() => {
    if (projectId) {
      const data = mockProjectsDB[Number(projectId)];
      if (data) {
        setFormData(prev => ({
          ...prev,
          projectName: data.projectName,
          organization: data.organization,
          objective: data.objective,
          requestedBudget: data.requestedBudget.toString(),
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
        }));
      }
    }
  }, [projectId]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
      if (errors.evidenceFiles) setErrors(prev => { const n = { ...prev }; delete n.evidenceFiles; return n; });
    }
  };
  const removeEvidence = (index: number) => setEvidenceFiles(prev => prev.filter((_, i) => i !== index));

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setActivityImages(prev => [...prev, ...Array.from(e.target.files || [])]);
      if (errors.activityImages) setErrors(prev => { const n = { ...prev }; delete n.activityImages; return n; });
    }
  };
  const removeImage = (index: number) => setActivityImages(prev => prev.filter((_, i) => i !== index));

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectName.trim()) newErrors.projectName = 'กรุณาระบุชื่อโครงการ';
    if (!formData.organization.trim()) newErrors.organization = 'กรุณาระบุหน่วยงาน';
    
    if (!formData.actualExpense) newErrors.actualExpense = 'กรุณาระบุจำนวนเงินที่ใช้จ่ายจริง';
    else if (parseFloat(formData.actualExpense) < 0) newErrors.actualExpense = 'จำนวนเงินต้องไม่ต่ำกว่า 0';

    if (evidenceFiles.length < 1) newErrors.evidenceFiles = 'กรุณาแนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์';
    if (activityImages.length < 2) newErrors.activityImages = 'กรุณาแนบภาพกิจกรรมอย่างน้อย 2 ภาพ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    router.push('/admin/budget_report');
    setIsSubmitting(false);
  };

  // Styles Helpers
  const getInputClass = (fieldName: string) => errors[fieldName] ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-orange-500 focus:ring-orange-500";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-2";
  const headerPillStyle = "w-full bg-[#F3F4F6] rounded-full py-3 text-center text-gray-600 font-bold text-lg border border-gray-200 shadow-sm mb-8";
  const errorTextStyle = "text-red-500 text-xs mt-1.5 ml-1 font-medium flex items-center animate-in fade-in slide-in-from-top-1";
  const formatFileSize = (size: number) => (size / 1024 / 1024).toFixed(2) + " MB";

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-8 pl-1">เพิ่มรายงาน</h1>

        {/* Section 1: ข้อมูลโครงการ */}
        <div className={headerPillStyle}>
            ข้อมูลโครงการ
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 px-2">
            <div>
                <label className={labelStyle}>ชื่อโครงการ <span className="text-red-500">*</span></label>
                <Input name="projectName" value={formData.projectName} onChange={handleInputChange} className={getInputClass('projectName')} placeholder="ระบุชื่อโครงการ" radius="full" />
                {errors.projectName && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.projectName}</p>}
            </div>
            <div>
                <label className={labelStyle}>ชื่อหน่วยงาน/องค์กร <span className="text-red-500">*</span></label>
                <Input name="organization" value={formData.organization} onChange={handleInputChange} className={getInputClass('organization')} placeholder="ระบุหน่วยงาน" radius="full" />
                {errors.organization && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.organization}</p>}
            </div>
            
            <div><label className={labelStyle}>วัตถุประสงค์</label><Input name="objective" value={formData.objective} onChange={handleInputChange} radius="full" /></div>
            <div><label className={labelStyle}>งบประมาณที่ขอ (บาท)</label><Input type="number" name="requestedBudget" value={formData.requestedBudget} onChange={handleInputChange} radius="full" placeholder="0.00" /></div>
            
            <div><label className={labelStyle}>วันเริ่มโครงการ</label><Input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} radius="full" /></div>
            <div><label className={labelStyle}>วันสิ้นสุดโครงการ</label><Input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} radius="full" /></div>
            
            <div className="md:col-span-2">
                <label className={labelStyle}>รายละเอียดเพิ่มเติม</label>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} className="rounded-3xl min-h-[100px]" />
            </div>
        </div>

        {/* Section 2: รายงานผล */}
        <div className={headerPillStyle}>
            รายงานการใช้จ่ายงบประมาณ
        </div>

        <div className="space-y-12 px-2">
            
            {/* 1. จำนวนเงิน */}
            <div id="actualExpense">
                <label className={labelStyle}>
                    จำนวนเงินที่ใช้จ่ายตามจริง <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-md">
                    <Input 
                        type="number" 
                        name="actualExpense"
                        value={formData.actualExpense}
                        onChange={handleInputChange}
                        size="lg"
                        radius="full"
                        className={`w-full text-lg transition-all ${getInputClass('actualExpense')}`}
                        placeholder="ระบุจำนวนเงิน"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">บาท</span>
                </div>
                {errors.actualExpense && (
                    <p className={errorTextStyle}>
                        <AlertCircle className="w-3 h-3 mr-1" /> {errors.actualExpense}
                    </p>
                )}
            </div>

            {/* 2. Upload เอกสาร */}
            <div id="evidenceFiles">
                <label className={labelStyle}>
                    ช่องแนบหลักฐาน <span className="text-gray-400 font-normal">(เช่น เอกสารสรุปผลโครงการ)</span> <span className="text-red-500">*</span>
                </label>
                
                {evidenceFiles.length > 0 ? (
                    <div className="space-y-3 mb-4">
                        {evidenceFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 border border-orange-100 bg-[#FFF8F0] rounded-xl transition-all hover:shadow-sm">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm border border-orange-100 shrink-0 text-[#F26522]">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[#1E3A8A] truncate underline decoration-transparent hover:decoration-[#1E3A8A] cursor-pointer transition-all">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeEvidence(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600 transition-all text-sm text-gray-600 font-medium mt-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มไฟล์เอกสาร
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleEvidenceUpload} />
                        </label>
                    </div>
                ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-all group ${errors.evidenceFiles ? 'border-red-300 bg-red-50/30' : 'border-gray-300'}`}>
                        <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full mb-3 shadow-sm transition-transform group-hover:scale-110 ${errors.evidenceFiles ? 'bg-white text-red-400' : 'bg-orange-50 text-orange-500'}`}>
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className={`text-sm ${errors.evidenceFiles ? 'text-red-500 font-medium' : 'text-gray-500'}`}>คลิกเพื่ออัปโหลดไฟล์เอกสาร</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleEvidenceUpload} />
                    </label>
                )}
                
                {errors.evidenceFiles && evidenceFiles.length === 0 && (
                    <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.evidenceFiles}</p>
                )}
            </div>

            {/* 3. Upload รูปภาพ */}
            <div id="activityImages" className="pb-4">
                <label className={labelStyle}>
                    แนบภาพกิจกรรม <span className="text-gray-400 font-normal">(อย่างน้อย 2 ภาพ)</span> <span className="text-red-500">*</span>
                </label>

                {activityImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {activityImages.map((file, idx) => (
                            <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 shadow-sm group bg-gray-50">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm transform scale-90 group-hover:scale-100">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        
                        <label className="flex flex-col items-center justify-center aspect-4/3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all group bg-white">
                            <div className="bg-orange-50 p-3 rounded-full mb-2 group-hover:bg-orange-100 transition-colors">
                                <Plus className="w-5 h-5 text-orange-500" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium group-hover:text-orange-600">เพิ่มรูปภาพ</span>
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImagesUpload} />
                        </label>
                    </div>
                ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-all group ${errors.activityImages ? 'border-red-300 bg-red-50/30' : 'border-gray-300'}`}>
                        <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full mb-3 shadow-sm transition-transform group-hover:scale-110 ${errors.activityImages ? 'bg-white text-red-400' : 'bg-orange-50 text-orange-500'}`}>
                                <CloudUpload className="w-6 h-6" />
                            </div>
                            <p className={`text-sm ${errors.activityImages ? 'text-red-500 font-medium' : 'text-gray-500'}`}>คลิกเพื่ออัปโหลดรูปภาพ</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImagesUpload} />
                    </label>
                )}

                {errors.activityImages && (
                    <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.activityImages}</p>
                )}
            </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-100">
            <CancelButton 
                onClick={() => router.back()}
                style={{ borderRadius: '9999px', height: '48px', paddingLeft: '2rem', paddingRight: '2rem' }}
            >
                ย้อนกลับ
            </CancelButton>
            <PrimaryButton 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                style={{ borderRadius: '9999px', height: '48px', paddingLeft: '3rem', paddingRight: '3rem' }}
                className="shadow-lg shadow-orange-200/50 hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5"
            >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
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