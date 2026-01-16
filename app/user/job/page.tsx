'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus, Edit, Trash2, Search, AlertTriangle, Clock } from 'lucide-react'; // 1. เพิ่ม Edit, Trash2, Search, AlertTriangle
import Image from 'next/image';
import Link from 'next/link'; // 2. เพิ่ม Link

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

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
  const itemsPerPage = 3;

  useEffect(() => {
    loadCurrentUser();
    loadJobs();
  }, []);

  useEffect(() => {
    // Filter jobs by search term
    const filteredJobs = jobs.filter((job) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        job.title?.toLowerCase().includes(searchLower) ||
        job.namejob?.toLowerCase().includes(searchLower) ||
        job.company?.companyname?.toLowerCase().includes(searchLower) ||
        job.position?.toLowerCase().includes(searchLower)
      );
    });
    setDisplayedJobs(filteredJobs.slice(0, page * itemsPerPage));
  }, [jobs, page, searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [jobs, page, displayedJobs]);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser({ id: userData.id, email: userData.email });
        console.log('👤 Current user:', userData);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/job?limit=100',
        { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }

      if (data.jobs && Array.isArray(data.jobs)) {
        // Debug: ตรวจสอบข้อมูล user
        console.log('📊 Jobs data:', data.jobs);
        console.log('👤 First job user data:', data.jobs[0]?.user);
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (displayedJobs.length < jobs.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleCreateJob = () => {
    window.location.href = '/user/job/create';
  };

  const handleViewDetail = (jobId: number) => {
    window.location.href = `/user/job/detail/${jobId}`;
  };

  // ฟังก์ชันสำหรับการลบ
  const handleDelete = (jobId: number) => {
    setModalConfig({
      isOpen: true,
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ที่จะลบประกาศงานนี้? การลบจะไม่สามารถกู้คืนได้',
      isDanger: true,
      showCancelButton: true,
      onConfirm: () => executeDelete(jobId),
    });
  };

  const executeDelete = async (jobId: number) => {
    try {
      // Close confirm modal first (or keep loading state)
      // For simplicity, close and show loading or new modal
      closeModal();

      console.log('🗑️ Deleting job:', jobId);

      const response = await fetch(`/api/job/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'เกิดข้อผิดพลาดในการลบ');
      }

      setModalConfig({
        isOpen: true,
        title: 'สำเร็จ',
        message: 'ลบประกาศงานสำเร็จ',
        isDanger: false,
        showCancelButton: false,
        onConfirm: () => {
          closeModal();
          loadJobs(); // Reload checks
        },
      });

    } catch (error: any) {
      console.error('❌ Delete error:', error);
      setModalConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: error.message || 'ไม่สามารถลบประกาศงานได้',
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} วันที่แล้ว`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} เดือนที่แล้ว`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ปีที่แล้ว`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Banner */}
      <div className="relative w-full h-[400px] bg-gray-800 mb-4">
        <Image
          src="/17.jpg"
          alt="Hero Banner"
          fill
          className="object-cover"
          style={{ objectPosition: 'center 60%' }}
          priority
        />             
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-end justify-end p-8 md:p-16">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-right">
            ประกาศรับสมัครงาน
          </h1>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section - หัวข้อและปุ่มสร้างประกาศงาน */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-800">ประกาศรับสมัครงาน</h1>
            <p className="text-sm text-gray-500 mt-1">ค้นหาโอกาสงานที่เหมาะกับคุณ</p>
          </div>
          <button
            onClick={handleCreateJob}
            className="flex items-center gap-2 px-8 py-2 bg-[#F26522] text-white rounded-lg font-medium hover:bg-[#FB793C] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5"/>
            <span>สร้างประกาศ</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาตำแหน่งงาน, ชื่อบริษัท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all hover:border-orange-300"
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={loadJobs}
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">ยังไม่มีประกาศงาน</p>
            <button
              onClick={handleCreateJob}
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              สร้างประกาศแรกของคุณ
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {displayedJobs.map((job) => (
              <div
                key={job.id}
                // 3. เพิ่ม relative ที่นี่ เพื่อให้ปุ่ม Edit วางตำแหน่งได้
                className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 group border border-gray-100 hover:border-orange-200"
              >

                {/* 4. ส่วนปุ่มจัดการ (แก้ไข/ลบ) มุมขวาบน - แสดงเฉพาะเจ้าของงาน */}
                {(() => {
                  const isOwner = currentUser && job.user && currentUser.id === job.user.id;
                  console.log(`🔍 Job ${job.id} ownership:`, {
                    jobId: job.id,
                    jobTitle: job.title,
                    currentUserId: currentUser?.id,
                    jobUserId: job.user?.id,
                    jobUserName: job.user?.fullName,
                    isOwner
                  });
                  return isOwner ? (
                    <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/user/job/edit/${job.id}`}
                        className="p-2 bg-white rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm transition-colors"
                        title="แก้ไขประกาศ"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(job.id);
                        }}
                        className="p-2 bg-white rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 shadow-sm transition-colors"
                        title="ลบประกาศ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : null;
                })()}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Section - แสดงเฉพาะเมื่อมีรูป */}
                  {job.JobPosterPath && !job.JobPosterPath.includes('placehold.co') && (
                    <div className="w-full md:w-56 h-64 bg-[#FFFFFF] rounded-lg flex-shrink-0 overflow-hidden relative">
                      <img
                        src={job.JobPosterPath}
                        alt={job.title || job.namejob}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      {/* Title: ใช้ namejob ตามที่ user ต้องการ */}
                      <h3 className="text-2xl font-semibold text-[#111827] mb-2 pr-20">
                        {job.title || 'ไม่มีชื่องาน'}
                      </h3>
                      {/* Subtitle: ใช้ namejob (เก็บ title รอง) */}
                      <p className="text-lg text-orange-600 font-medium">
                        {job.namejob || 'ไม่มีชื่อเรื่องย่อ'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-4 text-sm text-[#4B5563]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span>โดย {job.user?.fullName || 'ไม่ระบุผู้โพสต์'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewDetail(job.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        อ่านต่อ...
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading More Indicator */}
            {displayedJobs.length < jobs.length && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                <p className="text-gray-500 mt-2">กำลังโหลดเพิ่มเติม...</p>
              </div>
            )}

            {/* End of List */}
            {displayedJobs.length === jobs.length &&
              displayedJobs.length > itemsPerPage && (
                <div className="text-center py-8">
                  <p className="text-gray-500">ไม่มีข้อมูลเพิ่มเติม</p>
                </div>
              )}
          </div>
        )}
      </main>

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
    </div>
  );
}