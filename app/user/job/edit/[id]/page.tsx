// app/user/job/edit/[id]/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Upload, ChevronDown, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State
  const [formData, setFormData] = useState({
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
    transportation: '', // Field นี้ API ไม่ได้ใช้ แต่คงไว้ตามหน้า Create
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

  // Load Job Data
  useEffect(() => {
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/job/${jobId}`);
      if (!res.ok) throw new Error('Failed to fetch job');
      const data = await res.json();
      const job = data.job;

      // Mapping Data to Form
      setFormData({
        jobTitle: job.title || '',
        title: job.namejob || '',
        position: job.position || '',
        jobType: mapJobTypeToForm(job.jobType?.typename),
        education: mapEducationToForm(job.educationlevel),
        salary: job.salarydetail || '',
        companyName: job.company?.companyname || '',
        positions: job.numpositions?.toString() || '',
        address: job.location || job.company?.companyaddress || '',
        contact: job.contactInfo || '',
        transportation: '', // ไม่มีใน DB
        qualifications: job.qualification || '',
      });

      // Set existing images as previews
      setPreviews({
        attachment: job.JobPosterPath || null,
        logo: job.company?.CompanyLogoPath || null,
        image: job.company?.CompanyPicturePath || null,
      });

    } catch (error) {
      console.error(error);
      alert('ไม่สามารถโหลดข้อมูลงานได้');
      router.push('/user/job');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper Mapping Functions
  const mapJobTypeToForm = (type: string | undefined) => {
    const map: Record<string, string> = {
      'FULL_TIME': 'Full-time',
      'PART_TIME': 'Part-time',
      'CONTRACT': 'Contract',
      'INTERNSHIP': 'Internship',
    };
    return type ? map[type] || 'Select Type' : 'Select Type';
  };

  const mapEducationToForm = (edu: string | undefined) => {
    const map: Record<string, string> = {
      'BELOW_BACHELOR': 'ต่ำกว่าปริญญาตรี',
      'BACHELOR': 'ปริญญาตรี',
      'MASTER': 'ปริญญาโท',
      'DOCTORATE': 'ปริญญาเอก',
      'OTHER': 'อื่นๆ',
    };
    return edu ? map[edu] || 'Select Education' : 'Select Education';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setFiles({ ...files, [field]: file });
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews({ ...previews, [field]: reader.result as string });
        reader.readAsDataURL(file);
      } else {
        // For PDF or non-image, just clear preview or show generic icon
        setPreviews({ ...previews, [field]: null });
      }
    }
  };

  const handleSubmit = async () => {
    // Validation (Basic)
    if (!formData.jobTitle || !formData.companyName) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    setIsSubmitting(true);
    console.log('📤 Submitting job edit:', {
      jobId,
      formData,
      files: {
        attachment: files.attachment?.name,
        logo: files.logo?.name,
        image: files.image?.name,
      }
    });

    try {
      const submitData = new FormData();
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Append files only if new ones selected
      if (files.attachment) submitData.append('attachment', files.attachment);
      if (files.logo) submitData.append('logo', files.logo);
      if (files.image) submitData.append('image', files.image);

      console.log('🚀 Sending PATCH request to:', `/api/job/${jobId}`);

      const res = await fetch(`/api/job/${jobId}`, {
        method: 'PATCH',
        body: submitData,
      });

      console.log('📨 Response status:', res.status);

      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Server error:', err);
        throw new Error(err.error || 'Update failed');
      }

      const result = await res.json();
      console.log('✅ Update successful:', result);

      alert('แก้ไขประกาศงานสำเร็จ');
      router.push('/user/job');
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className='min-h-screen bg-[#F9FAFB] py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/user/job" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h2 className='text-2xl font-medium text-[#1F2937]'>
            แก้ไขประกาศงาน
          </h2>
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
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              />
            </div>

            {/* title */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>title</label>
              <input
                type='text'
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* ระดับการศึกษา และ ประเภทของงาน */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ระดับการศึกษา</label>
                <div className='relative'>
                  <select
                    className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm text-[#4B5563] focus:border-[#FB923C] focus:outline-none appearance-none bg-[#E5E7EB]'
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                  >
                    <option>Select Education</option>
                    <option>ต่ำกว่าปริญญาตรี</option>
                    <option>ปริญญาตรี</option>
                    <option>ปริญญาโท</option>
                    <option>ปริญญาเอก</option>
                    <option>อื่นๆ</option>
                  </select>
                  <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none' />
                </div>
              </div>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ประเภทของงาน</label>
                <div className='relative'>
                  <select
                    className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm text-[#4B5563] focus:border-[#FB923C] focus:outline-none appearance-none bg-[#E5E7EB]'
                    value={formData.jobType}
                    onChange={(e) => handleInputChange('jobType', e.target.value)}
                  >
                    <option>Select Type</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                  <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none' />
                </div>
              </div>
            </div>

            {/* ตำแหน่งงาน และ รายได้เฉลี่ย */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ตำแหน่งงาน</label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>รายได้เฉลี่ย</label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                />
              </div>
            </div>

            {/* ชื่อบริษัท และ จำนวนอัตรา */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ชื่อบริษัท</label>
                <input
                  type='text'
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>จำนวนอัตรา</label>
                <input
                  type='number'
                  min="1"
                  className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none'
                  value={formData.positions}
                  onChange={(e) => handleInputChange('positions', e.target.value)}
                />
              </div>
            </div>

            {/* Textareas */}
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>ที่อยู่บริษัท</label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>ช่องทางการติดต่อ</label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>วิธีการเดินทาง</label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={3}
                value={formData.transportation}
                onChange={(e) => handleInputChange('transportation', e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm text-[#6B7280] mb-2'>คุณสมบัติ</label>
              <textarea
                className='w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-sm focus:border-[#FB923C] focus:outline-none resize-none'
                rows={4}
                value={formData.qualifications}
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
              />
            </div>

            {/* File Uploads */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* File Attachment */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ไฟล์แนบงาน</label>
                {previews.attachment ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden h-48 flex items-center justify-center bg-gray-100'>
                    {previews.attachment.startsWith('/uploads') ? (
                      <span className="text-xs text-gray-500 break-all p-2">ไฟล์เดิม: {previews.attachment.split('/').pop()}</span>
                    ) : (
                      <img src={previews.attachment} alt="Preview" className='w-full h-full object-cover' />
                    )}
                    <button
                      onClick={() => {
                        setFiles({ ...files, attachment: null });
                        setPreviews({ ...previews, attachment: null }); // Note: This removes current file ref
                      }}
                      className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
                    >✕</button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer h-48 flex flex-col items-center justify-center'>
                    <Upload className='w-8 h-8 text-[#D1D5DB] mb-2' />
                    <span className='text-xs text-[#9CA3AF]'>อัปโหลดใหม่</span>
                    <input type='file' className='hidden' accept='.png,.jpg,.jpeg,.pdf' onChange={(e) => handleFileChange('attachment', e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>

              {/* Logo */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>ตราบริษัท</label>
                {previews.logo ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden h-48'>
                    <img src={previews.logo} alt="Preview" className='w-full h-full object-cover' />
                    <button onClick={() => { setFiles({ ...files, logo: null }); setPreviews({ ...previews, logo: null }); }}
                      className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
                    >✕</button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer h-48 flex flex-col items-center justify-center'>
                    <Upload className='w-8 h-8 text-[#D1D5DB] mb-2' />
                    <span className='text-xs text-[#9CA3AF]'>อัปโหลดใหม่</span>
                    <input type='file' className='hidden' accept='.png,.jpg,.jpeg' onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>

              {/* Company Image */}
              <div>
                <label className='block text-sm text-[#6B7280] mb-2'>รูปบริษัท</label>
                {previews.image ? (
                  <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden h-48'>
                    <img src={previews.image} alt="Preview" className='w-full h-full object-cover' />
                    <button onClick={() => { setFiles({ ...files, image: null }); setPreviews({ ...previews, image: null }); }}
                      className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
                    >✕</button>
                  </div>
                ) : (
                  <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer h-48 flex flex-col items-center justify-center'>
                    <Upload className='w-8 h-8 text-[#D1D5DB] mb-2' />
                    <span className='text-xs text-[#9CA3AF]'>อัปโหลดใหม่</span>
                    <input type='file' className='hidden' accept='.png,.jpg,.jpeg' onChange={(e) => handleFileChange('image', e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className='flex justify-end gap-4 pt-6'>
              <button
                onClick={() => router.push('/user/job')}
                className='px-8 py-3 border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-full hover:bg-[#F9FAFB]'
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className='px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-[#FFFFFF] text-sm font-medium rounded-full disabled:opacity-50'
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}