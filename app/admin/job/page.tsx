'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

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

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      const statusParam = activeStatus === 'all' ? 'all' : activeStatus;
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
  }, [activeStatus]);

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
    window.location.href = `/admin/job/edit/${jobId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-orange-100 text-orange-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

  // Client-side filter logic
  const filteredJobs = jobs.filter((job) => {
    // Status filter
    let matchStatus = true;
    if (activeStatus !== 'all') {
      const statusMap: Record<FilterStatus, string> = {
        all: '',
        pending: 'PENDING',
        approved: 'APPROVED',
        rejected: 'REJECTED',
      };
      matchStatus = job.status === statusMap[activeStatus];
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      (job.title || job.namejob)?.toLowerCase().includes(searchLower) ||
      job.company?.companyname?.toLowerCase().includes(searchLower) ||
      false;

    return matchStatus && matchSearch;
  });

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return stats.all;
    const statusMap: Record<FilterStatus, keyof typeof stats> = {
      all: 'all',
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    };
    return stats[statusMap[status]] || 0;
  };

  const headers = ['ชื่องาน', 'ประเภทงาน', 'วันที่', 'สถานะ', 'จัดการ'];
  const tableData = jobs.map((job) => [
    {
      type: 'company',
      logo: job.company?.CompanyLogoPath,
      title: job.title || job.namejob || 'ไม่ระบุชื่องาน',
      company: job.company?.companyname || 'ไม่ระบุบริษัท',
    },
    getJobTypeText(job.jobType),
    formatDate(job.createdAt),
    { type: 'status', status: job.status },
    { type: 'actions', jobId: job.id },
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          การจัดการประกาศรับสมัครงาน
        </h1>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'all' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('all')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Layers className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ทั้งหมด</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">
                {getStatusCount('all')}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'pending' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('pending')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">รออนุมัติ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">
                {getStatusCount('pending')}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'approved' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('approved')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">อนุมัติแล้ว</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">
                {getStatusCount('approved')}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'rejected' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('rejected')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ไม่อนุมัติ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">
                {getStatusCount('rejected')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ค้นหาด้วยชื่องานหรือบริษัท..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
                size="md"
                radius="md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        ชื่องาน
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        บริษัท
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        ประเภทงาน
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        วันที่
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        สถานะ
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          ไม่พบข้อมูลประกาศงาน
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-sm text-gray-800">
                            <div className="flex items-center gap-2">
                              {job.company?.CompanyLogoPath ? (
                                <img
                                  src={job.company.CompanyLogoPath}
                                  alt="Logo"
                                  className="w-8 h-8 rounded object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">-</span>
                                </div>
                              )}
                              <span className="font-medium">
                                {job.title || job.namejob || 'ไม่ระบุ'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {job.company?.companyname || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getJobTypeText(job.jobType)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                job.status
                              )}`}
                            >
                              {getStatusText(job.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetail(job.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(job.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
