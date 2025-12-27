'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus } from 'lucide-react';
import Image from 'next/image';

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
  const itemsPerPage = 3;

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    setDisplayedJobs(jobs.slice(0, page * itemsPerPage));
  }, [jobs, page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [jobs, page, displayedJobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/job?limit=100');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }

      // Show all approved jobs (not filtering by JobPosterPath anymore)
      // Jobs without poster will show placeholder
      if (data.jobs && Array.isArray(data.jobs)) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Banner */}
      <div className="relative w-full h-100">
        <Image
          src="/17.jpg"
          alt="Hero Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
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
                className="bg-[#F5F5F5] rounded-none shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Section */}
                  <div className="w-full md:w-56 h-64 bg-[#FFFFFF] rounded-lg flex-shrink-0 overflow-hidden relative">
                    {job.JobPosterPath && !job.JobPosterPath.includes('placehold.co') ? (
                      <img
                        src={job.JobPosterPath}
                        alt={job.title || job.namejob}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-400">
                        <span className="text-white text-4xl font-bold">PDF Attachment</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      {/* Title */}
                      <h3 className="text-2xl font-semibold text-[#111827] mb-2">
                        {job.title || job.namejob || 'ไม่มีชื่องาน'}
                      </h3>
                      {/* Subtitle / Company Name could go here if you want it prominent */}
                      <p className="text-lg text-orange-600 font-medium">
                        {job.company?.companyname || 'ไม่ระบุบริษัท'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-4 text-sm text-[#4B5563]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span>{job.company?.companyname || 'ไม่ระบุ'}</span>
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

      {/* Floating Action Button */}
      <button
        onClick={handleCreateJob}
        className="fixed bottom-8 right-8 rounded-full z-50"
      >
        <div
          className={
            "relative flex items-center gap-2 px-6 py-3 rounded-full overflow-hidden " +
            "backdrop-blur-md bg-white/10 border border-white/20 shadow-lg " +
            "hover:scale-[1.03] transition-transform duration-200"
          }
          style={{
            WebkitBackdropFilter: "blur(8px) saturate(120%)",
            backdropFilter: "blur(8px) saturate(120%)",
          }}
        >
          <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/6 via-white/12 to-white/4 mix-blend-screen" />
          <span className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.18),transparent_30%)] blur-xl opacity-80 pointer-events-none" />
          <Plus className="w-5 h-5 text-[#F97316] z-10" />
          <span className="text-[#F97316] font-medium z-10">สร้างประกาศ</span>
        </div>
      </button>
    </div>
  );
}