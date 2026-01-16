"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import { useRouter, useParams } from "next/navigation";
import { 
  FileText, X, Upload, AlertCircle, 
  Save, Calendar, Eye, CheckCircle2
} from "lucide-react";

import { PrimaryButton, CancelButton } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/InputTextArea";
import SuccessModal from "@/app/components/ui/SuccessModal";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { SummarySubmission } from "@/app/types/budget_report";

interface ExistingImageUI { id: number; url: string; }

// Helper
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function EditBudgetReportPage() {
  const router = useRouter();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportData, setReportData] = useState<SummarySubmission | null>(null);
  
  // Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data
  const [actualExpense, setActualExpense] = useState("");
  const [existingEvidence, setExistingEvidence] = useState<string | null>(null);
  const [newEvidenceFile, setNewEvidenceFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImageUI[]>([]);
  const [newActivityImages, setNewActivityImages] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const showError = (msg: string) => { setErrorMessage(msg); setShowErrorModal(true); };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/budget-report?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const report = data.report;
        setReportData(report);
        setActualExpense(report.totalActualExpense?.toString() || "");
        if (report.summaryFilePath) setExistingEvidence(report.summaryFilePath);
        if (report.images?.length) setExistingImages(report.images.map((img: any) => ({ id: img.id, url: img.imagePath })));
      } catch (err) { console.error(err); router.push("/admin/budget_report"); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [id, router]);

  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualExpense(e.target.value);
    if (errors.actualExpense) setErrors(prev => { const n = { ...prev }; delete n.actualExpense; return n; });
  };

  // --- Validation Helpers ---
  const processDoc = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { showError(`ไฟล์ ${file.name} มีขนาดเกิน 20MB`); return; }
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) { showError("รับเฉพาะไฟล์ PDF หรือ Word เท่านั้น"); return; }
    setNewEvidenceFile(file);
    if (errors.evidenceFiles) setErrors(prev => { const n = { ...prev }; delete n.evidenceFiles; return n; });
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) { showError(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`); return false; }
    if (file.size > 5 * 1024 * 1024) { showError(`รูปภาพ ${file.name} มีขนาดเกิน 5 MB`); return false; }
    return true;
  };

  const handleNewEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) processDoc(e.target.files[0]); };
  
  const handleNewImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const validFiles = Array.from(e.target.files).filter(processImage);
      if (validFiles.length > 0) {
        setNewActivityImages(prev => [...prev, ...validFiles]);
        if (errors.activityImages) setErrors(prev => { const n = { ...prev }; delete n.activityImages; return n; });
      }
      e.target.value = ""; // Reset
    }
  };

  const removeNewEvidence = () => { setNewEvidenceFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; };
  const removeNewImage = (i: number) => setNewActivityImages(prev => prev.filter((_, idx) => idx !== i));
  const removeExistingImage = (id: number) => { setExistingImages(prev => prev.filter(f => f.id !== id)); setDeletedImageIds(prev => [...prev, id]); };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!actualExpense || parseFloat(actualExpense) < 0) newErrors.actualExpense = "กรุณาระบุจำนวนเงินที่ใช้จ่ายจริง";
    if (!existingEvidence && !newEvidenceFile) newErrors.evidenceFiles = "กรุณาแนบไฟล์หลักฐาน";
    if (existingImages.length + newActivityImages.length < 2) newErrors.activityImages = "กรุณาแนบภาพกิจกรรมอย่างน้อย 2 ภาพ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreSubmit = () => { if (!validateForm()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } setShowConfirmModal(true); };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("id", id as string); 
        formData.append("projectId", reportData?.proposalId.toString() || "");
        formData.append("actualExpense", actualExpense);
        if (newEvidenceFile) formData.append("newEvidenceFiles", newEvidenceFile);
        newActivityImages.forEach(f => formData.append("newActivityImages", f));
        if (deletedImageIds.length > 0) formData.append("deletedFileIds", deletedImageIds.join(","));

        const res = await fetch("/api/budget-report", { method: "PUT", body: formData });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        setShowSuccessModal(true);
    } catch (e:any) { showError(e.message); } finally { setIsSubmitting(false); }
  };

  const headerPillStyle = "w-full bg-[#F3F4F6] rounded-lg py-3 text-center mb-6 border border-gray-200 mt-8 first:mt-0";
  const headerTextStyle = "text-gray-600 font-semibold text-lg";
  const labelStyle = "block text-sm text-gray-600 mb-2 ml-1 font-medium";
  const readOnlyInputClass = "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200";

  if (isLoading || !reportData) return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  const project = reportData.proposal;
  // @ts-ignore
  const manager = project?.manager; 

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      <SuccessModal show={showSuccessModal} onClose={() => { setShowSuccessModal(false); router.push("/admin/budget_report"); }} message="บันทึกการแก้ไขเรียบร้อยแล้ว" />
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmSubmit} title="ยืนยันการแก้ไข" message="คุณต้องการบันทึกการแก้ไขข้อมูลรายงานนี้ใช่หรือไม่?" confirmLabel="บันทึก" cancelLabel="ยกเลิก" />
      <ConfirmModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} onConfirm={() => setShowErrorModal(false)} title="แจ้งเตือน" message={errorMessage} confirmLabel="ตกลง" cancelLabel="" isDanger={true} />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-700 mt-4 mb-8 text-center">แก้ไขรายงานโครงการ</h1>

        {/* SECTION 1 */}
        <div className={headerPillStyle}><h2 className={headerTextStyle}>ส่วนที่ 1: ข้อมูลโครงการ</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 px-2">
            <div className="md:col-span-2"><label className={labelStyle}>ชื่อโครงการ</label><Input value={project?.projectName || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>ชื่อหน่วยงาน/องค์กร</label><Input value={project?.responsibilityUnit || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>งบประมาณที่ขอ (บาท)</label><Input value={project?.requestedAmount?.toLocaleString() || '0'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>วันเริ่มโครงการ</label><div className="relative"><Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" /><Input value={project?.projectStartDate ? new Date(project.projectStartDate).toLocaleDateString('th-TH') : '-'} readOnly disabled className={`${readOnlyInputClass} pl-10`} radius="md" /></div></div>
            <div><label className={labelStyle}>วันสิ้นสุดโครงการ</label><div className="relative"><Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" /><Input value={project?.projectEndDate ? new Date(project.projectEndDate).toLocaleDateString('th-TH') : '-'} readOnly disabled className={`${readOnlyInputClass} pl-10`} radius="md" /></div></div>
            <div className="md:col-span-2"><label className={labelStyle}>วัตถุประสงค์</label><Textarea value={project?.objective || '-'} readOnly disabled className={`${readOnlyInputClass} min-h-20`} /></div>
        </div>

        {/* SECTION 2 */}
        <div className={headerPillStyle}><h2 className={headerTextStyle}>ส่วนที่ 2: ข้อมูลผู้รับผิดชอบโครงการ</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 px-2">
            <div><label className={labelStyle}>ชื่อ-นามสกุล</label><Input value={manager ? `${manager.firstName} ${manager.lastName}` : '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>ตำแหน่ง</label><Input value={manager?.position || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>สังกัด/หน่วยงาน</label><Input value={manager?.department || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div><label className={labelStyle}>เบอร์โทรศัพท์</label><Input value={manager?.phoneNumber || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
            <div className="md:col-span-2"><label className={labelStyle}>อีเมล</label><Input value={manager?.email || '-'} readOnly disabled className={readOnlyInputClass} radius="md" /></div>
        </div>

        {/* SECTION 3 */}
        <div className={headerPillStyle}><h2 className={headerTextStyle}>ส่วนที่ 3: แก้ไขรายการใช้จ่ายและหลักฐาน</h2></div>
        <div className="space-y-8 px-2 mb-10">
            <div><label className={labelStyle}>จำนวนเงินที่ใช้จ่ายตามจริง <span className="text-red-500">*</span></label><div className="relative max-w-md"><Input type="number" value={actualExpense} onChange={handleExpenseChange} radius="md" className={`w-full pr-12 ${errors.actualExpense ? 'border-red-500' : 'border-gray-300'}`} placeholder="ระบุจำนวนเงิน" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span></div>{errors.actualExpense && <p className="text-red-500 text-xs mt-1.5 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.actualExpense}</p>}</div>

            <div>
                <label className={labelStyle}>เอกสารแนบหลักฐาน <span className="text-gray-400 font-normal">(ไฟล์สรุปผล/ใบเสร็จ)</span> <span className="text-red-500">*</span></label>
                <div onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }} onDrop={(e) => { e.preventDefault(); setIsDraggingFile(false); if(e.dataTransfer.files?.[0]) processDoc(e.dataTransfer.files[0]); }} className={`mt-2 border rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDraggingFile ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-10 h-10 text-gray-300 mb-3" /><p className="text-gray-700 font-medium mb-1">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p><p className="text-gray-400 text-xs mb-4">รองรับ PDF, DOCX ขนาดไม่เกิน 20 MB</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleNewEvidenceUpload} />
                </div>
                <div className="space-y-3 mt-4">
                    {existingEvidence && !newEvidenceFile && (
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white group hover:shadow-sm hover:border-orange-200 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg shrink-0"><FileText className="w-5 h-5 text-gray-500" /></div><div className="min-w-0"><a href={existingEvidence} target="_blank" className="text-sm font-semibold text-gray-800 truncate hover:text-orange-600 hover:underline">{existingEvidence.split('/').pop()}</a><div className="flex items-center gap-2 text-xs text-gray-500"><span>ไฟล์ปัจจุบัน</span><span className="w-1 h-1 bg-gray-300 rounded-full" /><span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> มีอยู่แล้ว</span></div></div></div>
                            <a href={existingEvidence} target="_blank" className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="ดูไฟล์"><Eye className="w-5 h-5" /></a>
                        </div>
                    )}
                    {newEvidenceFile && (
                        <div className="flex items-center justify-between p-3 border border-orange-200 rounded-xl bg-orange-50 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-orange-100 shrink-0"><FileText className="w-5 h-5 text-orange-600" /></div><div className="min-w-0"><a href={URL.createObjectURL(newEvidenceFile)} target="_blank" className="text-sm font-semibold text-gray-800 truncate hover:text-orange-600 hover:underline">{newEvidenceFile.name}</a><div className="flex items-center gap-2 text-xs text-gray-500"><span>{formatFileSize(newEvidenceFile.size)}</span><span className="w-1 h-1 bg-gray-300 rounded-full" /><span className="text-orange-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> ไฟล์ใหม่</span></div></div></div>
                            <button onClick={removeNewEvidence} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>
                {errors.evidenceFiles && <p className="text-red-500 text-xs mt-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.evidenceFiles}</p>}
            </div>

            <div>
                <label className={labelStyle}>ภาพกิจกรรม <span className="text-gray-400 font-normal">(อย่างน้อยรวม 2 ภาพ)</span> <span className="text-red-500">*</span></label>
                <div onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }} onDrop={(e) => { e.preventDefault(); setIsDraggingImage(false); if(e.dataTransfer.files?.length) { const validFiles = Array.from(e.dataTransfer.files).filter(processImage); setNewActivityImages(prev => [...prev, ...validFiles]); } }} className={`mt-2 border rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-6 ${isDraggingImage ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 bg-white hover:border-gray-300'} ${errors.activityImages ? 'border-red-300 bg-red-50/10' : ''}`} onClick={() => imageInputRef.current?.click()}>
                    <Upload className="w-10 h-10 text-gray-300 mb-3" /><p className="text-gray-700 font-medium mb-1">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่</p><p className="text-gray-400 text-xs mb-4">รองรับไฟล์ภาพ JPEG, PNG (ไม่เกิน 5 MB)</p>
                    <input ref={imageInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleNewImagesUpload} />
                </div>
                <div className="grid grid-cols-2 gap-6 [&>div:last-child:nth-child(odd)]:col-span-2 [&>div:last-child:nth-child(odd)]:w-[calc(50%-0.75rem)] [&>div:last-child:nth-child(odd)]:justify-self-center">
                    {existingImages.map((f) => (
                        <div key={f.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                            <a href={f.url} target="_blank" className="block w-full h-full cursor-zoom-in"><div className="relative w-full h-full"><Image src={f.url} alt="img" fill className="object-cover transition-transform duration-300 group-hover:scale-105" /></div></a>
                            <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/50 text-white text-xs rounded-lg backdrop-blur-md pointer-events-none">ภาพเดิม</div>
                            <button onClick={() => removeExistingImage(f.id)} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 shadow-md transition-all hover:bg-red-50"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {newActivityImages.map((f, i) => (
                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden border-2 border-orange-200 group shadow-sm animate-in fade-in zoom-in-95">
                            <a href={URL.createObjectURL(f)} target="_blank" className="block w-full h-full cursor-zoom-in"><div className="relative w-full h-full"><Image src={URL.createObjectURL(f)} alt="new" fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" /></div></a>
                            <div className="absolute bottom-2 left-2 px-3 py-1 bg-orange-500 text-white text-xs rounded-lg shadow-md pointer-events-none">ภาพใหม่</div>
                            <button onClick={() => removeNewImage(i)} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-gray-500 hover:text-red-500 shadow-md transition-all"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                {errors.activityImages && <p className="text-red-500 text-xs mt-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.activityImages}</p>}
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <CancelButton onClick={() => router.back()} style={{ borderRadius: '8px', height: '40px', width: '140px' }}>ย้อนกลับ</CancelButton>
            <PrimaryButton onClick={handlePreSubmit} disabled={isSubmitting} style={{ borderRadius: '8px', height: '40px', minWidth: '140px' }} className="flex items-center justify-center gap-2">
                {isSubmitting ? 'กำลังบันทึก...' : <>บันทึกการแก้ไข</>}
            </PrimaryButton>
        </div>
      </div>
    </div>
  );
}