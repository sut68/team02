'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

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

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = filterStatus === 'all' ? 'all' : filterStatus;
      const response = await fetch(`/api/admin/job?status=${statusParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }

      setJobs(data.jobs || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setError(errorMessage);
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleDelete = async (id: number) => {
    if (confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      try {
        const response = await fetch(`/api/admin/job/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบงาน');
        }

        await loadJobs();
        alert('ลบงานสำเร็จ');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบงาน';
        alert(errorMessage);
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleViewDetail = (jobId: number) => {
    // redirect to edit page
    window.location.href = `/admin/job/edit/${jobId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-orange-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'PENDING':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'อนุมัติแล้ว';
      case 'REJECTED':
        return 'ไม่อนุมัติ';
      case 'PENDING':
        return 'รออนุมัติ';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getJobTypeText = (jobType: { typename: string } | null | undefined) => {
    if (!jobType || !jobType.typename) return '-';
    const mapping: Record<string, string> = {
      FULL_TIME: 'Full-time',
      PART_TIME: 'Part-time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
    };
    return mapping[jobType.typename] || jobType.typename;
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <h2 className='text-2xl font-medium text-gray-800 mb-8'>
          การจัดการรับสมัครงาน
        </h2>

        {/* Filter Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <button
            onClick={() => setFilterStatus('all')}
            className={`bg-white rounded-2xl p-6 transition-all ${
              filterStatus === 'all'
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className='flex flex-col items-center gap-3'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Layers className='w-6 h-6 text-orange-500' />
              </div>
              <p className='text-sm text-gray-600'>ทั้งหมด</p>
              <p className='text-2xl font-semibold text-gray-800'>
                {stats.all}
              </p>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`bg-white rounded-2xl p-4  transition-all ${
              filterStatus === 'pending'
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)]  scale-105'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className='flex flex-col items-center gap-3'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <RefreshCw className='w-6 h-6 text-orange-500' />
              </div>
              <p className='text-sm text-gray-600'>รออนุมัติ</p>
              <p className='text-2xl font-semibold text-gray-800'>
                {stats.pending}
              </p>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`bg-white rounded-2xl p-6 transition-all ${
              filterStatus === 'approved'
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)]  scale-105'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className='flex flex-col items-center gap-3'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-orange-500' />
              </div>
              <p className='text-sm text-gray-600'>อนุมัติแล้ว</p>
              <p className='text-2xl font-semibold text-gray-800'>
                {stats.approved}
              </p>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`bg-white rounded-2xl p-6 transition-all ${
              filterStatus === 'rejected'
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className='flex flex-col items-center gap-3'>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <XCircle className='w-6 h-6 text-orange-500' />
              </div>
              <p className='text-sm text-gray-600'>ไม่อนุมัติ</p>
              <p className='text-2xl font-semibold text-gray-800'>
                {stats.rejected}
              </p>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='text-center py-16'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent'></div>
            <p className='text-gray-500 mt-2'>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className='text-center py-16'>
            <p className='text-red-500 text-lg mb-4'>{error}</p>
            <button
              onClick={loadJobs}
              className='px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors'
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* Job List Table */}
        {!loading && !error && (
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-medium text-gray-600'>
                      ชื่องาน
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-medium text-gray-600'>
                      ประเภทงาน
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-medium text-gray-600'>
                      วันที่
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-medium text-gray-600'>
                      สถานะ
                    </th>
                    <th className='px-6 py-4 text-right text-sm font-medium text-gray-600'>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className='px-6 py-16 text-center'>
                        <div className='flex flex-col items-center gap-3'>
                          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
                            <Layers className='w-8 h-8 text-gray-400' />
                          </div>
                          <p className='text-gray-500 font-medium'>
                            ไม่มีข้อมูลงาน
                          </p>
                          <p className='text-sm text-gray-400'>
                            {filterStatus === 'all'
                              ? 'ยังไม่มีประกาศงาน'
                              : `ไม่มีงานในสถานะ "${
                                  filterStatus === 'approved'
                                    ? 'อนุมัติแล้ว'
                                    : filterStatus === 'pending'
                                    ? 'รออนุมัติ'
                                    : 'ไม่อนุมัติ'
                                }"`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        className='hover:bg-gray-50 transition-colors'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            {job.company?.CompanyLogoPath ? (
                              <img
                                src={job.company.CompanyLogoPath}
                                alt='Logo'
                                className='w-12 h-12 rounded-lg object-cover border border-gray-200'
                              />
                            ) : (
                              <div className='w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center'>
                                <span className='text-gray-400 text-xs'>
                                  No Logo
                                </span>
                              </div>
                            )}
                            <div>
                              <p className='text-sm font-medium text-gray-800'>
                                {job.title || job.namejob || 'ไม่ระบุชื่องาน'}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {job.company?.companyname || 'ไม่ระบุบริษัท'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-gray-600'>
                            {getJobTypeText(job.jobType)}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-gray-600'>
                            {formatDate(job.createdAt)}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {getStatusText(job.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => handleViewDetail(job.id)}
                              className='p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                              title='ดูรายละเอียด'
                            >
                              <Edit2 className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                              title='ลบ'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Info */}
        {!loading && !error && jobs.length > 0 && (
          <div className='mt-4 text-sm text-gray-500 text-right'>
            แสดง {jobs.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
}
