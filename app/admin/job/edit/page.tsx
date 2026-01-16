'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CancelButton } from '@/app/components/ui/Button';

interface Job {
  id: number;
  namejob: string;
  title: string;
  position: string;
  jobType: string;
  education: string;
  salary: string;
  companyName: string;
  positions: string;
  address: string;
  contact: string;
  transportation: string;
  previews?: {
    attachment: string | null;
    logo: string | null;
    image: string | null;
  };
  status: string;
  date: string;
  createdAt: string;
}

export default function JobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    // ดึง jobId จาก localStorage (ในโปรเจคจริงใช้ router params)
    const jobId = localStorage.getItem('selectedJobId');

    if (jobId) {
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      const selectedJob = jobs.find((j: Job) => j.id === parseInt(jobId));
      setJob(selectedJob || null);
    }
  }, []);

  const handleBack = () => {
    // กลับไปหน้าจัดการรายการ
    localStorage.removeItem('selectedJobId');
    window.location.href = '/admin/job';
  };

  const handleSave = () => {
    if (!job) return;

    // บันทึกข้อมูลที่อัปเดตแล้วลง localStorage
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const updatedJobs = jobs.map((j: Job) =>
      j.id === job.id ? job : j
    );

    localStorage.setItem('jobs', JSON.stringify(updatedJobs));

    alert('บันทึกข้อมูลสำเร็จ');

    // กลับไปหน้าจัดการรายการ
    localStorage.removeItem('selectedJobId');
    window.location.href = '/admin/job';
  };

  const handleCancel = () => {
    // ยกเลิกและกลับไปหน้าจัดการรายการโดยไม่บันทึก
    if (confirm('คุณต้องการยกเลิกการแก้ไขหรือไม่?')) {
      localStorage.removeItem('selectedJobId');
      window.location.href = '/admin/job';
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!job) return;

    // อัปเดตสถานะใน state
    setJob({ ...job, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว': return 'bg-orange-500';
      case 'ไม่อนุมัติ': return 'bg-red-500';
      case 'รออนุมัติ': return 'bg-yellow-500';
      default: return 'bg-orange-500';
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">ไม่พบข้อมูลงาน</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>กลับ</span>
          </button>
        </div>

        <h2 className="text-2xl font-medium text-gray-800 mb-8">
          รายละเอียดงาน
        </h2>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-6">
            {/* ข้อมูลหลัก */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">title</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.title || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Title</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.namejob || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ตำแหน่งงาน</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.position || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ประเภทของงาน</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.jobType === 'Select Type' ? '-' : job.jobType}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ระดับการศึกษา</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.education || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">รายได้เฉลี่ย</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.salary || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ชื่อบริษัท</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.companyName || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">จำนวนอัตรา</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.positions || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">ที่อยู่บริษัท</label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{job.address || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">ช่องทางการติดต่อ</label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{job.contact || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">วิธีการเดินทาง</label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{job.transportation || '-'}</p>
              </div>
            </div>

            {/* รูปภาพ */}
            {(job.previews?.attachment || job.previews?.logo || job.previews?.image) && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">รูปภาพ</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {job.previews?.attachment && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">ไฟล์แนบงาน</p>
                      <img
                        src={job.previews.attachment}
                        alt="Attachment"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {job.previews?.logo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">ตราบริษัท</p>
                      <img
                        src={job.previews.logo}
                        alt="Logo"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {job.previews?.image && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">รูปบริษัท</p>
                      <img
                        src={job.previews.image}
                        alt="Company"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* สถานะและวันที่ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">สถานะ</label>
                <div>
                  <span className={`inline-block px-4 py-2 text-sm font-medium text-white rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">วันที่สร้าง</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.date}</p>
                </div>
              </div>
            </div>

            {/* ปุ่มเปลี่ยนสถานะ */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-600 mb-3">เปลี่ยนสถานะ</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateStatus('อนุมัติแล้ว')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${job.status === 'อนุมัติแล้ว'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                >
                  อนุมัติแล้ว
                </button>
                <button
                  onClick={() => handleUpdateStatus('ไม่อนุมัติ')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${job.status === 'ไม่อนุมัติ'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                >
                  ไม่อนุมัติ
                </button>
              </div>
            </div>

            {/* ปุ่มบันทึกและยกเลิก */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <CancelButton
                onClick={handleCancel}
                className='px-8 py-3 text-sm rounded-full'
              >
                ยกเลิก
              </CancelButton>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}