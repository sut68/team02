'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';
import { ProjectProposal, ProjectManager } from '@/app/types/budget_approval';

import { Input } from '@/app/components/ui/Input';
import { InputIcon } from '@/app/components/ui/InputIcon';
import { Textarea } from '@/app/components/ui/InputTextArea';
import { CancelButton, PrimaryButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State สำหรับเก็บข้อมูล
  const [projectData, setProjectData] = useState<ProjectProposal>({
    projectName: '', objective: '', description: '', requestedAmount: 0,
    projectStartDate: '', projectEndDate: '', responsibilityUnit: '', coverFilePath: ''
  });
  const [coverFilePreview, setCoverFilePreview] = useState<string | null>(null);
  const [managerData, setManagerData] = useState<ProjectManager>({
    firstName: '', lastName: '', department: '', position: '', phoneNumber: '', email: ''
  });

  // Styles
  const headerPillStyle = "w-full bg-[#F3F4F6] rounded-full py-3 text-center mb-6 border border-gray-200";
  const headerTextStyle = "text-gray-600 font-bold text-lg";
  const labelStyle = "block text-sm text-gray-600 mb-2 ml-4";
  
  // Helper for Input Styles
  const getInputClass = (fieldName: string) => {
    const baseClass = "border-gray-300 focus-visible:border-orange-500 focus-visible:ring-orange-500";
    const errorClass = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500";
    return errors[fieldName] ? errorClass : baseClass;
  };

  // ✅ 1. Fetch Data เมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        // ยิง API ไปดึงข้อมูลตาม ID
        const res = await fetch(`/api/project-proposal?id=${projectId}`);
        const data = await res.json();
        const project = data.proposals ? data.proposals[0] : null;

        if (!project) {
          throw new Error('ไม่พบข้อมูลโครงการ');
        }
        
        // ✅ ตรวจสอบสถานะ: ต้องเป็น PENDING (รอดำเนินการ) เท่านั้นถึงจะแก้ได้
        // (เผื่อใน DB ยังเก็บเป็น statusId แบบเก่า ก็เช็คเผื่อไว้ด้วย)
        const currentStatus = project.status || 'PENDING';
        if (currentStatus !== 'PENDING' && currentStatus !== 'DRAFT') {
            alert(`โครงการนี้อยู่ในสถานะ "${currentStatus}" ไม่สามารถแก้ไขได้`);
            router.push('/admin/budget_approval');
            return;
        }

        // แปลงวันที่ให้เป็น YYYY-MM-DD สำหรับ input type="date"
        const formatDate = (isoStr: string | undefined) => isoStr ? new Date(isoStr).toISOString().split('T')[0] : '';

        setProjectData({
            ...project,
            projectStartDate: formatDate(project.projectStartDate),
            projectEndDate: formatDate(project.projectEndDate),
        });

        // ถ้ามีข้อมูล Manager ก็ใส่เข้าไป
        if (project.manager) {
            setManagerData(project.manager);
        }
        
        if (project.coverFilePath) {
            setCoverFilePreview(project.coverFilePath);
        }

      } catch (error) {
        console.error(error);
        alert('ไม่พบข้อมูลโครงการ หรือเกิดข้อผิดพลาดในการโหลด');
        router.push('/admin/budget_approval');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, router]);

  // Handlers
  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: name === 'requestedAmount' ? parseFloat(value) || 0 : value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManagerData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverFilePreview(reader.result as string);
        // ในระบบจริงควร Upload ไป API แล้วเอา URL มาใส่
        setProjectData(prev => ({ ...prev, coverFilePath: `/budget/uploads/${file.name}` }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (!projectData.projectName) { alert('กรุณากรอกข้อมูลเบื้องต้นให้ครบถ้วน'); return; }
    setStep(2);
    window.scrollTo(0, 0);
  };

  // ✅ 2. Submit Data (Update)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/project-proposal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: parseInt(projectId),
            ...projectData,
            // ส่งข้อมูล Manager ไปด้วย (หมายเหตุ: ต้องมั่นใจว่า Backend รองรับการอัปเดต Manager แบบ Nested)
            // หรือถ้า Backend ยังไม่รองรับ อาจต้องเขียน Logic เพิ่มที่ API ฝั่ง Server
            manager: managerData 
        })
      });

      if (res.ok) {
        setShowSuccessModal(true); 
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
      setShowSuccessModal(false);
      router.push('/admin/budget_approval'); 
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      <SuccessModal show={showSuccessModal} onClose={handleModalClose} message="แก้ไขข้อมูลโครงการเรียบร้อยแล้ว" />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-600 mb-6 pl-1">แก้ไขโครงการ (ID: {projectId})</h1>

        {/* STEP 1: ข้อมูลโครงการ */}
        {step === 1 && (
          <div>
            <div className={headerPillStyle}><h2 className={headerTextStyle}>รายละเอียดโครงการ</h2></div>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>ชื่อโครงการ <span className="text-red-500">*</span></label>
                <Input name="projectName" value={projectData.projectName} onChange={handleProjectChange} radius="full" className={getInputClass('projectName')} />
              </div>
              <div>
                  <label className={labelStyle}>ชื่อหน่วยงาน/องค์กร <span className="text-red-500">*</span></label>
                  <Input name="responsibilityUnit" value={projectData.responsibilityUnit} onChange={handleProjectChange} radius="full" className={getInputClass('responsibilityUnit')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>วัตถุประสงค์</label>
                  <Input name="objective" value={projectData.objective} onChange={handleProjectChange} radius="full" className={getInputClass('objective')} />
                </div>
                <div>
                  <label className={labelStyle}>งบประมาณที่ขอ</label>
                  <Input type="number" name="requestedAmount" value={projectData.requestedAmount || ''} onChange={handleProjectChange} radius="full" className={getInputClass('requestedAmount')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>วันเริ่มจัดโครงการ</label>
                  <InputIcon type="date" name="projectStartDate" value={projectData.projectStartDate} onChange={handleProjectChange} radius="full" className={getInputClass('projectStartDate')} />
                </div>
                <div>
                  <label className={labelStyle}>วันสิ้นสุดโครงการ</label>
                  <Input type="date" name="projectEndDate" value={projectData.projectEndDate} onChange={handleProjectChange} radius="full" className={getInputClass('projectEndDate')} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>รายละเอียดเพิ่มเติม</label>
                <Textarea name="description" value={projectData.description} onChange={handleProjectChange} className={`rounded-3xl min-h-[100px] ${getInputClass('description')}`} />
              </div>
              
              {/* Image Upload */}
              <div>
                <label className={labelStyle}>ภาพปก/ภาพโปสเตอร์กิจกรรม</label>
                <div className="mt-2 border rounded-3xl h-64 flex flex-col items-center justify-center bg-white hover:bg-orange-50 transition-colors cursor-pointer relative overflow-hidden border-gray-300">
                  {coverFilePreview ? (
                     <>
                       <img src={coverFilePreview} className="w-full h-full object-contain" alt="Preview"/>
                       <button onClick={(e)=>{e.stopPropagation(); setCoverFilePreview(null); setProjectData(p => ({...p, coverFilePath: ''}));}} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow text-orange-500 font-bold z-10">ลบรูปภาพ</button>
                     </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <div className="bg-gray-100 p-4 rounded-2xl mb-3"><ImageIcon className="w-8 h-8 text-gray-400" /></div>
                        <span className="text-gray-500 font-medium">อัปโหลดรูปภาพ</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-8 pb-10 gap-5">
                <CancelButton onClick={() => router.back()} style={{ borderRadius: '9999px', width: '160px', height: '40px' }}>ยกเลิก</CancelButton>
                <PrimaryButton onClick={handleNext} style={{ borderRadius: '9999px', width: '160px', height: '40px' }}>ถัดไป</PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ผู้รับผิดชอบ */}
        {step === 2 && (
          <div>
            <div className={headerPillStyle}><h2 className={headerTextStyle}>รายละเอียดผู้รับผิดชอบโครงการ</h2></div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelStyle}>ชื่อ</label><Input name="firstName" value={managerData.firstName} onChange={handleManagerChange} radius="full" /></div>
                <div><label className={labelStyle}>นามสกุล</label><Input name="lastName" value={managerData.lastName} onChange={handleManagerChange} radius="full" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelStyle}>สังกัด/หน่วยงาน</label><Input name="department" value={managerData.department} onChange={handleManagerChange} radius="full" /></div>
                <div><label className={labelStyle}>แผนก/ฝ่าย</label><Input name="position" value={managerData.position} onChange={handleManagerChange} radius="full" /></div>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelStyle}>เบอร์โทรติดต่อ</label><Input name="phoneNumber" value={managerData.phoneNumber} onChange={handleManagerChange} radius="full" /></div>
                <div><label className={labelStyle}>Email</label><Input name="email" value={managerData.email} onChange={handleManagerChange} radius="full" /></div>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 pb-10 items-center">
                 <CancelButton onClick={() => setStep(1)} style={{ borderRadius: '9999px', width: '160px', height: '40px' }}>ย้อนกลับ</CancelButton>
                <PrimaryButton onClick={handleSubmit} disabled={isSubmitting} style={{ borderRadius: '9999px', width: '160px', height: '40px' }}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}