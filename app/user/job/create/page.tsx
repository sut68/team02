'use client';
import React, { useState } from 'react';
import { Upload, ChevronDown, AlertTriangle } from 'lucide-react';
import { CancelButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal';

export default function JobPostPage() {
  // 1. กำหนด State เริ่มต้น
  const [formData, setFormData] = useState({
    jobTitle: '',
    title: '',
    position: '',
    jobType: 'Select Type',
    education: 'Select Education',
    salary: '',
    companyName: '',
    positions: '', // เริ่มต้นเป็น string ว่าง เพื่อให้ input ว่างได้
    address: '',
    contact: '',
    transportation: '',
    qualifications: '',
  });

  const [files, setFiles] = useState<{
    attachment: File | null;
    logo: File | null;
    image: File | null;
  }>({
    attachment: null,
    logo: null,
    image: null,
  });

  const [previews, setPreviews] = useState<{
    attachment: string | null;
    logo: string | null;
    image: string | null;
  }>({
    attachment: null,
    logo: null,
    image: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDanger: false,
    showCancelButton: false,
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ เช็คความถูกต้องของฟอร์มแบบ Real-time
  const isFormValid =
    formData.jobTitle.trim() !== '' &&
    formData.title.trim() !== '' &&
    formData.education !== 'Select Education' &&
    formData.jobType !== 'Select Type' &&
    formData.position.trim() !== '' &&
    formData.salary.trim() !== '' &&
    formData.companyName.trim() !== '' &&
    formData.positions.trim() !== '' && // เช็คว่ามีการกรอกจำนวนอัตรา
    formData.address.trim() !== '' &&
    formData.contact.trim() !== '' &&
    formData.transportation.trim() !== '' &&
    formData.qualifications.trim() !== '';

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setFiles({ ...files, [field]: file });

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews({ ...previews, [field]: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews({ ...previews, [field]: null });
      }
    }
  };

  const handleCancel = () => {
    // รีเซ็ตค่าทั้งหมด
    setFormData({
      jobTitle: '',
      title: '',
      position: '',
      jobType: 'Select Type',
      education: 'Select Education',
      salary: '',
      companyName: '',
      positions: '',
      address: '',
      contact: '',
      transportation: '',
      qualifications: '',
    });
    setFiles({ attachment: null, logo: null, image: null });
    setPreviews({ attachment: null, logo: null, image: null });

    window.location.href = '/user/job';
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      setModalConfig({
        isOpen: true,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมายดอกจัน (*)',
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
      return;
    }

    if (isNaN(Number(formData.positions)) || Number(formData.positions) < 1) {
      setModalConfig({
        isOpen: true,
        title: 'ข้อมูลไม่ถูกต้อง',
        message: 'กรุณาระบุจำนวนอัตราให้ถูกต้อง (อย่างน้อย 1 อัตรา)',
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();

      // Append ข้อมูล Text
      submitFormData.append('jobTitle', formData.jobTitle);
      submitFormData.append('title', formData.title);
      submitFormData.append('position', formData.position);
      submitFormData.append('jobType', formData.jobType);
      submitFormData.append('education', formData.education);
      submitFormData.append('salary', formData.salary);
      submitFormData.append('companyName', formData.companyName);

      // ✅ ส่ง positions ไป (ค่าจะเป็น string ใน FormData เสมอ Backend ต้องแปลงเป็น Int เอง)
      submitFormData.append('positions', formData.positions);

      submitFormData.append('address', formData.address);
      submitFormData.append('contact', formData.contact);
      submitFormData.append('transportation', formData.transportation);
      submitFormData.append('qualifications', formData.qualifications);

      // Append ข้อมูลไฟล์
      if (files.attachment) submitFormData.append('attachment', files.attachment);
      if (files.logo) submitFormData.append('logo', files.logo);
      if (files.image) submitFormData.append('image', files.image);

      const response = await fetch('/api/job', {
        method: 'POST',
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างประกาศงาน');
      }

      // Show Success Modal
      setSuccessMessage('บันทึกประกาศงานสำเร็จ!');
      setShowSuccess(true);

    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการสร้างประกาศงาน';


      setModalConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage,
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-white py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* Header Section */}
        <div className='mb-8'>
          <h2 className='text-3xl font-semibold text-gray-800'>
            ประกาศรับสมัครงาน
          </h2>
          <p className='text-sm text-gray-500 mt-2'>กรอกข้อมูลเพื่อสร้างประกาศงานใหม่</p>
        </div>

        <div className='bg-[#FFFFFF] rounded-lg shadow-sm p-8'>
          <div className='space-y-6'>
            {/* ชื่อหัวข้อของงาน */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>
                ชื่อหัวข้อของงาน <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                placeholder='ระบุชื่อหัวข้อของงาน'
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              />
            </div>

            {/* title */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>title <span className='text-red-500'>*</span></label>
              <input
                type='text'
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                placeholder='ระบุ title'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* ระดับการศึกษา และ ประเภทของงาน */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ระดับการศึกษา <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <select
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none appearance-none bg-white cursor-pointer pr-10 hover:border-orange-300 transition-colors'
                    value={formData.education}
                    onChange={(e) =>
                      handleInputChange('education', e.target.value)
                    }
                  >
                    <option value='' className='text-gray-400'>เลือกระดับการศึกษา</option>
                    <option>ต่ำกว่าปริญญาตรี</option>
                    <option>ปริญญาตรี</option>
                    <option>ปริญญาโท</option>
                    <option>ปริญญาเอก</option>
                    <option>อื่นๆ</option>
                  </select>
                  <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none' />
                </div>
              </div>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ประเภทของงาน <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <select
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none appearance-none bg-white cursor-pointer pr-10 hover:border-orange-300 transition-colors'
                    value={formData.jobType}
                    onChange={(e) =>
                      handleInputChange('jobType', e.target.value)
                    }
                  >
                    <option value='' className='text-gray-400'>เลือกประเภทงาน</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                  <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none' />
                </div>
              </div>
            </div>

            {/* ตำแหน่งงาน และ รายได้เฉลี่ย */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ตำแหน่งงาน <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  placeholder='ระบุตำแหน่งงาน'
                  value={formData.position}
                  onChange={(e) =>
                    handleInputChange('position', e.target.value)
                  }
                />
              </div>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  รายได้เฉลี่ย <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  placeholder='ระบุรายได้เฉลี่ย'
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                />
              </div>
            </div>

            {/* ชื่อบริษัท และ จำนวนอัตรา */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ชื่อบริษัท <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  placeholder='ระบุชื่อบริษัท'
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange('companyName', e.target.value)
                  }
                />
              </div>

              {/* 🔴 ส่วนที่แก้ไข: จำนวนอัตรา (ให้พิมพ์เอา) */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  จำนวนอัตรา <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'     // บังคับให้ browser รับเฉพาะตัวเลข
                  min="1"           // ป้องกันค่าติดลบ หรือ 0
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  placeholder='ระบุจำนวนอัตรา'
                  value={formData.positions}
                  onChange={(e) =>
                    handleInputChange('positions', e.target.value)
                  }
                />
              </div>
            </div>

            {/* ที่อยู่บริษัท */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>
                ที่อยู่บริษัท <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                placeholder='ระบุที่อยู่บริษัท'
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            {/* ช่องทางการติดต่อ */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>
                ช่องทางการติดต่อ <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                placeholder='ระบุช่องทางการติดต่อ'
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
              />
            </div>

            {/* วิธีการเดินทาง */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>
                วิธีการเดินทาง <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                placeholder='ระบุวิธีการเดินทาง'
                value={formData.transportation}
                onChange={(e) =>
                  handleInputChange('transportation', e.target.value)
                }
              />
            </div>

            {/* คุณสมบัติ */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>
                คุณสมบัติ <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={4}
                placeholder='ระบุคุณสมบัติของผู้สมัคร (เช่น ประสบการณ์, ทักษะที่ต้องการ)'
                value={formData.qualifications}
                onChange={(e) =>
                  handleInputChange('qualifications', e.target.value)
                }
              />
            </div>

            {/* File Uploads (ส่วนเดิม) */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* ไฟล์แนบงาน */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ไฟล์แนบงาน
                </label>
                {previews.attachment ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden'>
                    <img
                      src={previews.attachment}
                      alt='Preview'
                      className='w-full h-48 object-cover'
                    />
                    <button
                      onClick={() => {
                        setFiles({ ...files, attachment: null });
                        setPreviews({ ...previews, attachment: null });
                      }}
                      className='absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]'
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer'>
                    <div className='flex flex-col items-center gap-2'>
                      <Upload className='w-10 h-10 text-[#D1D5DB]' />
                      <p className='text-sm text-[#9CA3AF]'>อัปโหลดไฟล์</p>
                      <p className='text-xs text-[#9CA3AF]'>PNG, JPG, PDF</p>
                    </div>
                    <input
                      type='file'
                      className='hidden'
                      accept='.png,.jpg,.jpeg,.pdf'
                      onChange={(e) =>
                        handleFileChange(
                          'attachment',
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>
                )}
                {files.attachment && (
                  <p className='text-xs text-[#4B5563] mt-2'>
                    {files.attachment.name}
                  </p>
                )}
              </div>

              {/* ตราบริษัท */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  ตราบริษัท
                </label>
                {previews.logo ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden'>
                    <img
                      src={previews.logo}
                      alt='Preview'
                      className='w-full h-48 object-cover'
                    />
                    <button
                      onClick={() => {
                        setFiles({ ...files, logo: null });
                        setPreviews({ ...previews, logo: null });
                      }}
                      className='absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]'
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer'>
                    <div className='flex flex-col items-center gap-2'>
                      <Upload className='w-10 h-10 text-[#D1D5DB]' />
                      <p className='text-sm text-[#9CA3AF]'>อัปโหลดไฟล์</p>
                      <p className='text-xs text-[#9CA3AF]'>PNG, JPG</p>
                    </div>
                    <input
                      type='file'
                      className='hidden'
                      accept='.png,.jpg,.jpeg'
                      onChange={(e) =>
                        handleFileChange('logo', e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
                {files.logo && (
                  <p className='text-xs text-[#4B5563] mt-2'>
                    {files.logo.name}
                  </p>
                )}
              </div>

              {/* รูปบริษัท */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>
                  รูปบริษัท
                </label>
                {previews.image ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden'>
                    <img
                      src={previews.image}
                      alt='Preview'
                      className='w-full h-48 object-cover'
                    />
                    <button
                      onClick={() => {
                        setFiles({ ...files, image: null });
                        setPreviews({ ...previews, image: null });
                      }}
                      className='absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]'
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer'>
                    <div className='flex flex-col items-center gap-2'>
                      <Upload className='w-10 h-10 text-[#D1D5DB]' />
                      <p className='text-sm text-[#9CA3AF]'>อัปโหลดไฟล์</p>
                      <p className='text-xs text-[#9CA3AF]'>PNG, JPG</p>
                    </div>
                    <input
                      type='file'
                      className='hidden'
                      accept='.png,.jpg,.jpeg'
                      onChange={(e) =>
                        handleFileChange('image', e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
                {files.image && (
                  <p className='text-xs text-[#4B5563] mt-2'>
                    {files.image.name}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className='flex justify-end gap-4 pt-6'>
              <CancelButton
                onClick={handleCancel}
                className='px-8 py-3 text-sm'
              >
                ยกเลิก
              </CancelButton>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid}
                className='px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-[#FFFFFF] text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gray-50">
              <div className={`p-3 rounded-full ${modalConfig.isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F26522]'}`}>
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{modalConfig.message}</p>
            <div className="flex gap-3 justify-center">
              {modalConfig.showCancelButton && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  ยกเลิก
                </button>
              )}
              <button
                onClick={modalConfig.onConfirm}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${modalConfig.isDanger
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 hover:shadow-red-500/30'
                  : 'bg-[#F26522] hover:bg-[#d65a1f] shadow-orange-500/20 hover:shadow-orange-500/30'
                  }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        show={showSuccess}
        message={successMessage}
        onClose={() => {
          setShowSuccess(false);
          window.location.href = '/user/job';
        }}
      />
    </div>
  );
}