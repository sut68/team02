'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FileText, X, CloudUpload, Upload, Plus, AlertCircle, Trash2, Save } from 'lucide-react';
import { PrimaryButton, CancelButton } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

// --- Types ---
interface ApprovedProject {
  id: number;
  projectName: string;
  organization: string;
  objective: string;
  requestedBudget: number;
  startDate: string;
  endDate: string;
}

interface ExistingFile {
  id: string;
  url: string;
  name: string;
  size: number;
}

interface BudgetReportData {
  projectId: number;
  actualExpense: number;
  evidenceFiles: ExistingFile[];
  activityImages: ExistingFile[];
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
  }
};

const mockExistingReport: Record<number, BudgetReportData> = {
  101: {
    projectId: 101,
    actualExpense: 24500,
    evidenceFiles: [
      { id: 'ev-1', url: '#', name: 'สรุปผลโครงการ_เดิม.pdf', size: 1024 * 1024 * 1.5 }
    ],
    activityImages: [
      { id: 'img-1', url: 'https://placehold.co/600x400', name: 'รูปกิจกรรม_1.jpg', size: 1024 * 500 },
      { id: 'img-2', url: 'https://placehold.co/600x400/orange/white', name: 'รูปกิจกรรม_2.jpg', size: 1024 * 600 }
    ]
  }
};

export default function EditBudgetReportPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id; 
  
  // --- State ---
  const [projectInfo, setProjectInfo] = useState<ApprovedProject | null>(null); // แยก State ข้อมูลโครงการ (Read-only)
  const [actualExpense, setActualExpense] = useState(''); // Field 1: เงิน

  // Field 2: ไฟล์เอกสาร
  const [existingEvidence, setExistingEvidence] = useState<ExistingFile[]>([]);
  const [newEvidenceFiles, setNewEvidenceFiles] = useState<File[]>([]);
  
  // Field 3: รูปภาพ
  const [existingImages, setExistingImages] = useState<ExistingFile[]>([]);
  const [newActivityImages, setNewActivityImages] = useState<File[]>([]);

  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Load Data ---
  useEffect(() => {
    if (projectId) {
      const pId = Number(projectId);
      const project = mockProjectsDB[pId];
      const existingReport = mockExistingReport[pId];

      if (project) setProjectInfo(project);

      if (existingReport) {
        setActualExpense(existingReport.actualExpense.toString());
        setExistingEvidence(existingReport.evidenceFiles);
        setExistingImages(existingReport.activityImages);
      }
      
      setIsLoading(false);
    }
  }, [projectId]);

  // --- Handlers ---
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualExpense(e.target.value);
    if (errors.actualExpense) setErrors(prev => { const n = { ...prev }; delete n.actualExpense; return n; });
  };

  // Files Handlers
  const handleNewEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setNewEvidenceFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
      if (errors.evidenceFiles) setErrors(prev => { const n = { ...prev }; delete n.evidenceFiles; return n; });
    }
  };
  const removeNewEvidence = (index: number) => setNewEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingEvidence = (id: string) => {
    setExistingEvidence(prev => prev.filter(f => f.id !== id));
    setDeletedFileIds(prev => [...prev, id]);
  };

  // Images Handlers
  const handleNewImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setNewActivityImages(prev => [...prev, ...Array.from(e.target.files || [])]);
      if (errors.activityImages) setErrors(prev => { const n = { ...prev }; delete n.activityImages; return n; });
    }
  };
  const removeNewImage = (index: number) => setNewActivityImages(prev => prev.filter((_, i) => i !== index));
  const removeExistingImage = (id: string) => {
    setExistingImages(prev => prev.filter(f => f.id !== id));
    setDeletedFileIds(prev => [...prev, id]);
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check 1: Expense
    if (!actualExpense) newErrors.actualExpense = 'กรุณาระบุจำนวนเงินที่ใช้จ่ายจริง';
    else if (parseFloat(actualExpense) < 0) newErrors.actualExpense = 'จำนวนเงินต้องไม่ต่ำกว่า 0';

    // Check 2: Evidence Files
    const totalEvidence = existingEvidence.length + newEvidenceFiles.length;
    if (totalEvidence < 1) newErrors.evidenceFiles = 'กรุณาแนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์';

    // Check 3: Activity Images
    const totalImages = existingImages.length + newActivityImages.length;
    if (totalImages < 2) newErrors.activityImages = 'กรุณาแนบภาพกิจกรรมอย่างน้อย 2 ภาพ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    // API Payload simulation
    console.log({
        projectId,
        actualExpense,
        deletedFileIds,
        newEvidenceFiles,
        newActivityImages
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    alert("บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว");
    router.push('/admin/budget_report');
    setIsSubmitting(false);
  };

  // Styles
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-2";
  const headerPillStyle = "w-full bg-[#F3F4F6] rounded-full py-3 text-center text-gray-600 font-bold text-lg border border-gray-200 shadow-sm mb-8";
  const errorTextStyle = "text-red-500 text-xs mt-1.5 ml-1 font-medium flex items-center animate-in fade-in slide-in-from-top-1";
  const readOnlyInputClass = "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200";
  const formatFileSize = (size: number) => (size / 1024 / 1024).toFixed(2) + " MB";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-8 pl-1">แก้ไขรายงานโครงการ</h1>

        {/* --- Section 1: ข้อมูลโครงการ (Read Only) --- */}
        <div className={headerPillStyle}>ข้อมูลโครงการ</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 px-2 opacity-90">
            <div>
                <label className={labelStyle}>ชื่อโครงการ</label>
                <Input value={projectInfo?.projectName || ''} readOnly disabled className={readOnlyInputClass} radius="full" />
            </div>
            <div>
                <label className={labelStyle}>ชื่อหน่วยงาน/องค์กร</label>
                <Input value={projectInfo?.organization || ''} readOnly disabled className={readOnlyInputClass} radius="full" />
            </div>
            <div><label className={labelStyle}>วัตถุประสงค์</label><Input value={projectInfo?.objective || ''} readOnly disabled className={readOnlyInputClass} radius="full" /></div>
            <div><label className={labelStyle}>งบประมาณที่ขอ (บาท)</label><Input value={projectInfo?.requestedBudget || ''} readOnly disabled className={readOnlyInputClass} radius="full" /></div>
            <div><label className={labelStyle}>วันเริ่มโครงการ</label><Input type="date" value={projectInfo?.startDate || ''} readOnly disabled className={readOnlyInputClass} radius="full" /></div>
            <div><label className={labelStyle}>วันสิ้นสุดโครงการ</label><Input type="date" value={projectInfo?.endDate || ''} readOnly disabled className={readOnlyInputClass} radius="full" /></div>
        </div>

        {/* --- Section 2: รายงานผล (Editable: 3 Fields Only) --- */}
        <div className={headerPillStyle}>แก้ไขรายการใช้จ่ายและหลักฐาน</div>

        <div className="space-y-12 px-2 bg-white rounded-xl">
            
            {/* FIELD 1: จำนวนเงิน */}
            <div>
                <label className={labelStyle}>
                    จำนวนเงินที่ใช้จ่ายตามจริง <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-md">
                    <Input 
                        type="number" 
                        value={actualExpense}
                        onChange={handleExpenseChange}
                        size="lg"
                        radius="full"
                        className={`w-full text-lg ${errors.actualExpense ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                        placeholder="ระบุจำนวนเงิน"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">บาท</span>
                </div>
                {errors.actualExpense && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.actualExpense}</p>}
            </div>

            {/* FIELD 2: เอกสารแนบหลักฐาน */}
            <div>
                <label className={labelStyle}>
                    เอกสารแนบหลักฐาน <span className="text-gray-400 font-normal">(ไฟล์เดิม + ไฟล์ใหม่)</span> <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3 mb-4">
                    {/* Existing Files */}
                    {existingEvidence.map((file) => (
                         <div key={file.id} className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-blue-100 shrink-0 text-blue-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <a href={file.url} className="text-sm font-medium text-blue-700 truncate hover:underline">{file.name}</a>
                                    <p className="text-xs text-gray-500 mt-0.5">ไฟล์เดิม • {formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button onClick={() => removeExistingEvidence(file.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {/* New Files */}
                    {newEvidenceFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="flex items-center justify-between p-4 border border-orange-100 bg-[#FFF8F0] rounded-xl">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-orange-100 shrink-0 text-[#F26522]">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-orange-500 mt-0.5">ไฟล์ใหม่ • {formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button onClick={() => removeNewEvidence(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 hover:border-orange-300 hover:text-orange-600 transition-all text-sm text-gray-600 font-medium mt-2">
                        <Plus className="w-4 h-4" /> เพิ่มไฟล์เอกสารใหม่
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleNewEvidenceUpload} />
                    </label>
                </div>
                {errors.evidenceFiles && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.evidenceFiles}</p>}
            </div>

            {/* FIELD 3: ภาพกิจกรรม */}
            <div className="pb-4">
                <label className={labelStyle}>
                    ภาพกิจกรรม <span className="text-gray-400 font-normal">(อย่างน้อยรวม 2 ภาพ)</span> <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((file) => (
                        <div key={file.id} className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-blue-100 shadow-sm group bg-gray-50">
                            <img src={file.url} alt="existing" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shadow-sm font-medium">ภาพเดิม</span>
                            <button onClick={() => removeExistingImage(file.id)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    ))}
                    {/* New Images */}
                    {newActivityImages.map((file, idx) => (
                        <div key={`new-img-${idx}`} className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm group bg-gray-50">
                            <img src={URL.createObjectURL(file)} alt="new preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded shadow-sm font-medium">ภาพใหม่</span>
                            <button onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-600 hover:text-red-500 shadow-sm"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                    <label className="flex flex-col items-center justify-center aspect-4/3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all group bg-white">
                        <div className="bg-orange-50 p-3 rounded-full mb-2 group-hover:bg-orange-100 transition-colors"><CloudUpload className="w-5 h-5 text-orange-500" /></div>
                        <span className="text-xs text-gray-500 font-medium group-hover:text-orange-600">เพิ่มรูปภาพใหม่</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleNewImagesUpload} />
                    </label>
                </div>
                {errors.activityImages && <p className={errorTextStyle}><AlertCircle className="w-3 h-3 mr-1" /> {errors.activityImages}</p>}
            </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-100">
            <CancelButton onClick={() => router.back()} style={{ borderRadius: '9999px', height: '48px', paddingLeft: '2rem', paddingRight: '2rem' }}>ยกเลิก</CancelButton>
            <PrimaryButton onClick={handleSubmit} disabled={isSubmitting} style={{ borderRadius: '9999px', height: '48px', paddingLeft: '2.5rem', paddingRight: '2.5rem' }} className="shadow-lg shadow-orange-200/50 hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                {isSubmitting ? 'กำลังบันทึก...' : (<><Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง</>)}
            </PrimaryButton>
        </div>

      </div>
    </div>
  );
}