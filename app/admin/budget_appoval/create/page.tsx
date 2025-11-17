// app/create-project/page.tsx (หรือ path ของคุณ)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';
import { ProjectProposal, ProjectManager } from '@/app/types/budget_approval';
import { createProjectProposal, createProjectManager } from '@/app/lib/actions';

import { Input } from '@/app/components/ui/Input';
import { InputIcon } from '@/app/components/ui/InputIcon';
import { Textarea } from '@/app/components/ui/InputTextArea';
import { CancelButton, PrimaryButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal'; // Import Modal เข้ามา

export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setProjectData(prev => ({ ...prev, coverFilePath: `/uploads/${file.name}` }));
        if (errors.coverFilePath) setErrors(prev => { const n = {...prev}; delete n.coverFilePath; return n; });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation Step 1
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!projectData.projectName.trim()) newErrors.projectName = 'กรุณาระบุชื่อโครงการ';
    if (!projectData.responsibilityUnit.trim()) newErrors.responsibilityUnit = 'กรุณาระบุหน่วยงาน';
    if (!projectData.objective.trim()) newErrors.objective = 'กรุณาระบุวัตถุประสงค์';
    if (!projectData.requestedAmount || projectData.requestedAmount <= 0) newErrors.requestedAmount = 'งบประมาณต้องมากกว่า 0';
    if (!projectData.projectStartDate) newErrors.projectStartDate = 'กรุณาระบุวันเริ่มต้น';
    if (!projectData.projectEndDate) newErrors.projectEndDate = 'กรุณาระบุวันสิ้นสุด';
    if (projectData.projectStartDate && projectData.projectEndDate) {
        if (new Date(projectData.projectEndDate) < new Date(projectData.projectStartDate)) {
            newErrors.projectEndDate = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น';
        }
    }
    if (!projectData.description.trim()) newErrors.description = 'กรุณาระบุรายละเอียด';
    if (!projectData.coverFilePath) newErrors.coverFilePath = 'กรุณาอัปโหลดรูปภาพปก';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation Step 2
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!managerData.firstName.trim()) newErrors.firstName = 'กรุณาระบุชื่อ';
    if (!managerData.lastName.trim()) newErrors.lastName = 'กรุณาระบุนามสกุล';
    if (!managerData.department.trim()) newErrors.department = 'กรุณาระบุสังกัด';
    if (!managerData.position.trim()) newErrors.position = 'กรุณาระบุตำแหน่ง';
    if (!managerData.phoneNumber.trim()) newErrors.phoneNumber = 'กรุณาระบุเบอร์โทร';
    else if (!/^\d{9,10}$/.test(managerData.phoneNumber.replace(/-/g, ''))) newErrors.phoneNumber = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    
    if (!managerData.email.trim()) newErrors.email = 'กรุณาระบุอีเมล';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerData.email)) newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
        setStep(2);
        window.scrollTo(0, 0);
    } else {
        alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
        alert('กรุณากรอกข้อมูลผู้รับผิดชอบให้ครบถ้วน');
        return;
    }

    setIsSubmitting(true);
    try {
      const projectRes = await createProjectProposal(projectData);
      if (projectRes.success && projectRes.ppid) {
        await createProjectManager(projectRes.ppid, managerData);
        
        // เปิด Modal เมื่อสำเร็จ
        setShowSuccessModal(true); 
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
      setShowSuccessModal(false);
      // แก้ไขจาก budget_appoval เป็น budget_approval
      router.push('/admin/budget_approval'); 
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans relative">
      {/* เรียกใช้ Modal ตรงนี้ */}
      <SuccessModal 
        show={showSuccessModal} 
        onClose={handleModalClose}
        message="บันทึกข้อมูลโครงการเรียบร้อยแล้ว"
      />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-600 mb-6 pl-1">เพิ่มโครงการ</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className={headerPillStyle}>
              <h2 className={headerTextStyle}>รายละเอียดโครงการ</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>ชื่อโครงการ <span className="text-red-500">*</span></label>
                <Input name="projectName" value={projectData.projectName} onChange={handleProjectChange} radius="full" className={getInputClass('projectName')} />
                {errors.projectName && <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectName}</p>}
              </div>
              
              <div>
                <label className={labelStyle}>ชื่อหน่วยงาน/องค์กร <span className="text-red-500">*</span></label>
                <Input name="responsibilityUnit" value={projectData.responsibilityUnit} onChange={handleProjectChange} radius="full" className={getInputClass('responsibilityUnit')} />
                {errors.responsibilityUnit && <p className="text-red-500 text-xs mt-1 ml-4">{errors.responsibilityUnit}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>วัตถุประสงค์ <span className="text-red-500">*</span></label>
                  <Input name="objective" value={projectData.objective} onChange={handleProjectChange} radius="full" className={getInputClass('objective')} />
                  {errors.objective && <p className="text-red-500 text-xs mt-1 ml-4">{errors.objective}</p>}
                </div>
                <div>
                  <label className={labelStyle}>งบประมาณที่ขอ <span className="text-red-500">*</span></label>
                  <Input type="number" name="requestedAmount" value={projectData.requestedAmount || ''} onChange={handleProjectChange} radius="full" className={getInputClass('requestedAmount')} min="0" />
                  {errors.requestedAmount && <p className="text-red-500 text-xs mt-1 ml-4">{errors.requestedAmount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>วันเริ่มจัดโครงการ <span className="text-red-500">*</span></label>
                  <InputIcon type="date" name="projectStartDate" value={projectData.projectStartDate} onChange={handleProjectChange} radius="full" className={`cursor-pointer ${getInputClass('projectStartDate')}`} />
                  {errors.projectStartDate && <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectStartDate}</p>}
                </div>
                <div>
                  <label className={labelStyle}>วันสิ้นสุดโครงการ <span className="text-red-500">*</span></label>
                  <Input type="date" name="projectEndDate" value={projectData.projectEndDate} onChange={handleProjectChange} radius="full" className={`cursor-pointer ${getInputClass('projectEndDate')}`} min={projectData.projectStartDate} />
                  {errors.projectEndDate && <p className="text-red-500 text-xs mt-1 ml-4">{errors.projectEndDate}</p>}
                </div>
              </div>

              <div>
                <label className={labelStyle}>รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                <Textarea name="description" value={projectData.description} onChange={handleProjectChange} className={`rounded-3xl min-h-[100px] ${errors.description ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:border-orange-500 focus-visible:ring-orange-500'}`} />
                {errors.description && <p className="text-red-500 text-xs mt-1 ml-4">{errors.description}</p>}
              </div>

              <div>
                <label className={labelStyle}>ภาพปก/ภาพโปสเตอร์กิจกรรม <span className="text-red-500">*</span></label>
                <div className={`mt-2 border rounded-3xl h-64 flex flex-col items-center justify-center relative overflow-hidden bg-white hover:bg-orange-50 transition-colors cursor-pointer ${errors.coverFilePath ? 'border-red-500 border-2' : 'border-gray-300 hover:border-orange-500'}`}>
                  {coverFilePreview ? (
                    <>
                      <img src={coverFilePreview} alt="Preview" className="w-full h-full object-contain" />
                      <button onClick={(e) => { e.stopPropagation(); setCoverFilePreview(null); setProjectData(p => ({...p, coverFilePath: ''})); }} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10">
                        <span className="font-bold text-orange-500 px-2">ลบรูปภาพ</span>
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <div className="bg-gray-100 p-4 rounded-2xl mb-3">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <span className="text-gray-500 font-medium">อัปโหลดรูปภาพ</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
                {errors.coverFilePath && <p className="text-red-500 text-xs mt-1 ml-4">{errors.coverFilePath}</p>}
              </div>

              <div className="flex justify-end pt-8 pb-10 gap-5">
                <CancelButton onClick={() => router.back()} style={{ borderRadius: '9999px', width: '160px', height: '40px', fontSize: '16px' }}>ยกเลิก</CancelButton>
                <PrimaryButton onClick={handleNext} style={{ borderRadius: '9999px', width: '160px', height: '40px', fontSize: '16px' }}>ถัดไป</PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className={headerPillStyle}>
              <h2 className={headerTextStyle}>รายละเอียดผู้รับผิดชอบโครงการ</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>ชื่อ <span className="text-red-500">*</span></label>
                  <Input name="firstName" value={managerData.firstName} onChange={handleManagerChange} radius="full" className={getInputClass('firstName')} />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1 ml-4">{errors.firstName}</p>}
                </div>
                <div>
                  <label className={labelStyle}>นามสกุล <span className="text-red-500">*</span></label>
                  <Input name="lastName" value={managerData.lastName} onChange={handleManagerChange} radius="full" className={getInputClass('lastName')} />
                   {errors.lastName && <p className="text-red-500 text-xs mt-1 ml-4">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>สังกัด/หน่วยงาน <span className="text-red-500">*</span></label>
                  <Input name="department" value={managerData.department} onChange={handleManagerChange} radius="full" className={getInputClass('department')} />
                   {errors.department && <p className="text-red-500 text-xs mt-1 ml-4">{errors.department}</p>}
                </div>
                <div>
                  <label className={labelStyle}>แผนก/ฝ่าย <span className="text-red-500">*</span></label>
                  <Input name="position" value={managerData.position} onChange={handleManagerChange} radius="full" className={getInputClass('position')} />
                   {errors.position && <p className="text-red-500 text-xs mt-1 ml-4">{errors.position}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>เบอร์โทรติดต่อ <span className="text-red-500">*</span></label>
                  <Input name="phoneNumber" value={managerData.phoneNumber} onChange={handleManagerChange} radius="full" className={getInputClass('phoneNumber')} />
                   {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 ml-4">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Email <span className="text-red-500">*</span></label>
                  <Input name="email" value={managerData.email} onChange={handleManagerChange} radius="full" className={getInputClass('email')} />
                   {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email}</p>}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 pb-10 items-center">
                 <CancelButton onClick={() => setStep(1)} style={{ borderRadius: '9999px', width: '160px', height: '40px', fontSize: '16px' }}>ย้อนกลับ</CancelButton>
                <PrimaryButton onClick={handleSubmit} disabled={isSubmitting} style={{ borderRadius: '9999px', width: '160px', height: '40px', fontSize: '16px' }}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}