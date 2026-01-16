'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ConfirmModal from '@/app/components/ui/ConfirmModal';

interface Job {
  id: number;
  title: string;
  namejob: string;
  position: string | null;
  qualification: string | null;
  location: string | null;
  salarydetail: string | null;
  numpositions: number | null;
  contactInfo: string | null;
  JobPosterPath: string | null;
  educationlevel: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
  jobType?: {
    id: number;
    typename: string;
  } | null;
  company?: {
    id: number;
    companyname: string;
    companyaddress: string | null;
    CompanyLogoPath: string | null;
    CompanyPicturePath: string | null;
  } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDanger: false,
    showCancelButton: true, // Helper for cancelLabel
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/job/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลงาน');
      }

      setJob(data.job);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setError(errorMessage);
      console.error('Error loading job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/job');
  };

  const handleSave = async () => {
    if (!job) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/job/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: job.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }

      setModalConfig({
        isOpen: true,
        title: 'สำเร็จ',
        message: 'บันทึกข้อมูลสำเร็จ',
        isDanger: false,
        showCancelButton: false, // Alert style
        onConfirm: () => {
          closeModal();
          router.push('/admin/job');
        },
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      setModalConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage,
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
      console.error('Error saving job:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: 'ยืนยันการยกเลิก',
      message: 'คุณต้องการยกเลิกการแก้ไขใช่หรือไม่?',
      isDanger: false,
      showCancelButton: true,
      onConfirm: () => {
        closeModal();
        router.push('/admin/job');
      },
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!job) return;
    setJob({ ...job, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-orange-500';
      case 'REJECTED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'อนุมัติแล้ว';
      case 'REJECTED': return 'ไม่อนุมัติ';
      case 'PENDING': return 'รออนุมัติ';
      default: return status;
    }
  };

  const getJobTypeText = (jobType: { typename: string } | null | undefined) => {
    if (!jobType || !jobType.typename) return '-';
    const mapping: Record<string, string> = {
      'FULL_TIME': 'Full-time',
      'PART_TIME': 'Part-time',
      'CONTRACT': 'Contract',
      'INTERNSHIP': 'Internship',
    };
    return mapping[jobType.typename] || jobType.typename;
  };

  const getEducationText = (education: string | null) => {
    if (!education) return '-';
    const mapping: Record<string, string> = {
      'BELOW_BACHELOR': 'ต่ำกว่าปริญญาตรี',
      'BACHELOR': 'ปริญญาตรี',
      'MASTER': 'ปริญญาโท',
      'DOCTORATE': 'ปริญญาเอก',
      'OTHER': 'อื่นๆ',
    };
    return mapping[education] || education;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-2">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || 'ไม่พบข้อมูลงาน'}</p>
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
                <label className="block text-sm font-medium text-gray-600 mb-2">ชื่อหัวข้อของงาน</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.title || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">title</label>
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
                  <p className="text-gray-800">{getJobTypeText(job.jobType)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ระดับการศึกษา</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{getEducationText(job.educationlevel)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">รายได้เฉลี่ย</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.salarydetail || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ชื่อบริษัท</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.company?.companyname || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">จำนวนอัตรา</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{job.numpositions || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">ที่อยู่/สถานที่</label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{job.location || job.company?.companyaddress || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">ช่องทางการติดต่อ</label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{job.contactInfo || '-'}</p>
              </div>
            </div>

            {job.qualification && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">คุณสมบัติ</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{job.qualification}</p>
                </div>
              </div>
            )}

            {/* รูปภาพ */}
            {(job.JobPosterPath || job.company?.CompanyLogoPath || job.company?.CompanyPicturePath) && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">รูปภาพ</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {job.JobPosterPath && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">ไฟล์แนบงาน</p>
                      <img
                        src={job.JobPosterPath}
                        alt="Attachment"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {job.company?.CompanyLogoPath && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">ตราบริษัท</p>
                      <img
                        src={job.company.CompanyLogoPath}
                        alt="Logo"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {job.company?.CompanyPicturePath && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">รูปบริษัท</p>
                      <img
                        src={job.company.CompanyPicturePath}
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
                    {getStatusText(job.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">วันที่สร้าง</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-gray-800">{formatDate(job.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* ปุ่มเปลี่ยนสถานะ */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-600 mb-3">เปลี่ยนสถานะ</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${job.status === 'APPROVED'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${job.status === 'REJECTED'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                >
                  ไม่อนุมัติ
                </button>
                <button
                  onClick={() => handleUpdateStatus('PENDING')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${job.status === 'PENDING'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    }`}
                >
                  รออนุมัติ
                </button>
              </div>
            </div>

            {/* ปุ่มบันทึกและยกเลิก */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-8 py-3 bg-[#6D6E70] text-white text-sm font-medium rounded-lg hover:bg-[#4A4B4C] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>


      </div>
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 p-6 text-center">

            {/* Icon */}
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gray-50">
              <div className={`p-3 rounded-full ${modalConfig.isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F26522]'}`}>
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {modalConfig.message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              {modalConfig.showCancelButton && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {modalConfig.showCancelButton ? 'ยกเลิก' : ''}
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
    </div >
  );
}

