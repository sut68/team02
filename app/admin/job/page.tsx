
'use client';
import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';

interface Job {
  id: number;
  jobTitle: string;
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

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadJobs();
    
    // ฟังการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = () => {
      loadJobs();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // รีเฟรชทุก 1 วินาทีเพื่ออัปเดตข้อมูลจากหน้า create
    const interval = setInterval(loadJobs, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadJobs = () => {
    const storedJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    setJobs(storedJobs);
  };

  const handleDelete = (id:any) => {
    if (confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      const updatedJobs = jobs.filter(job => job.id !== id);
      localStorage.setItem('jobs', JSON.stringify(updatedJobs));
      setJobs(updatedJobs);
    }
  };

  const handleViewDetail = (jobId: number) => {
    localStorage.setItem('selectedJobId', jobId.toString());
    window.location.href = '/admin/job/edit';
  };

  const getStatusColor = (status : any) => {
    switch (status) {
      case 'อนุมัติแล้ว': return 'bg-orange-500';
      case 'ไม่อนุมัติ': return 'bg-red-500';
      case 'รออนุมัติ': return 'bg-yellow-500';
      default: return 'bg-orange-500';
    }
  };

  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter(job => {
    if (filterStatus === 'approved') return job.status === 'อนุมัติแล้ว';
    if (filterStatus === 'pending') return job.status === 'รออนุมัติ';
    if (filterStatus === 'rejected') return job.status === 'ไม่อนุมัติ';
    return true;
  });

  const stats = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'รออนุมัติ').length,
    approved: jobs.filter(j => j.status === 'อนุมัติแล้ว').length,
    rejected: jobs.filter(j => j.status === 'ไม่อนุมัติ').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-medium text-gray-800 mb-8">
          การจัดการรับสมัครงาน
        </h2>

        {/* Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`bg-white rounded-2xl h-40 px-4 transition-all ${
              filterStatus === 'all' 
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105' 
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.all}</p>
            </div>
          </button>

          <button 
            onClick={() => setFilterStatus('pending')}
            className={`bg-white rounded-2xl h-40 px-4 transition-all ${
              filterStatus === 'pending' 
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)]  scale-105' 
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600">รออนุมัติ</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.pending}</p>
            </div>
          </button>

          <button 
            onClick={() => setFilterStatus('approved')}
            className={`bg-white rounded-2xl h-40 px-4 transition-all ${
              filterStatus === 'approved' 
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)]  scale-105' 
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.approved}</p>
            </div>
          </button>

          <button 
            onClick={() => setFilterStatus('rejected')}
            className={`bg-white rounded-2xl h-40 px-4 transition-all ${
              filterStatus === 'rejected' 
                ? 'shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105' 
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600">ไม่อนุมัติ</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.rejected}</p>
            </div>
          </button>
        </div>

        {/* Job List Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ชื่องาน</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ประเภทงาน</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">วันที่</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะ</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Layers className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">ไม่มีข้อมูลงาน</p>
                        <p className="text-sm text-gray-400">
                          {filterStatus === 'all' 
                            ? 'กรุณาสร้างประกาศงานในหน้า Create' 
                            : `ไม่มีงานในสถานะ "${filterStatus === 'approved' ? 'อนุมัติแล้ว' : filterStatus === 'pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}"`
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {/* ส่วนที่แก้ไข: ลบรูปภาพออก เหลือแต่ Text */}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {job.jobTitle || job.title || 'ไม่ระบุชื่องาน'}
                          </p>
                          <p className="text-xs text-gray-500">{job.companyName || 'ไม่ระบุบริษัท'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {job.jobType === 'Select Type' ? '-' : job.jobType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{job.date || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewDetail(job.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(job.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          </div>
        </div>

        {/* Summary Info */}
        {filteredJobs.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-right">
            แสดง {filteredJobs.length} จาก {jobs.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
}