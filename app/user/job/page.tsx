'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus } from 'lucide-react';
import Image from 'next/image';

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

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    loadJobs();
    
    const handleStorageChange = () => {
      loadJobs();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadJobs, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const approvedJobs = jobs.filter(job => 
      job.status === 'อนุมัติแล้ว' && 
      job.previews?.attachment && 
      job.previews.attachment.trim() !== ''
    );
    setDisplayedJobs(approvedJobs.slice(0, page * itemsPerPage));
  }, [jobs, page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [jobs, page]);

  const loadJobs = () => {
    const storedJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const sortedJobs = storedJobs.sort((a: Job, b: Job) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setJobs(sortedJobs);
  };

  const loadMore = () => {
    const approvedJobs = jobs.filter(job => 
      job.status === 'อนุมัติแล้ว' && 
      job.previews?.attachment && 
      job.previews.attachment.trim() !== ''
    );
    if (displayedJobs.length < approvedJobs.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleCreateJob = () => {
    window.location.href = '/user/job/create';
  };

  const handleViewDetail = (jobId: number) => {
    window.location.href = `/user/job/detail/${jobId}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Banner */}
      <div className="relative w-full h-150">
        <Image
          src="/17.jpg"
          alt="Hero Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {displayedJobs.length === 0 ? (
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
                    {job.previews?.attachment && !job.previews.attachment.includes('placehold.co') ? (
                      <img
                        src={job.previews.attachment}
                        alt={job.jobTitle}
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
                        {job.jobTitle || job.title || 'ไม่มีชื่องาน'}
                      </h3>
                      {/* Subtitle / Company Name could go here if you want it prominent */}
                      <p className="text-lg text-orange-600 font-medium">
                        {job.companyName}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-4 text-sm text-[#4B5563]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{job.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span>{job.companyName || 'ไม่ระบุ'}</span>
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
            {displayedJobs.length < jobs.filter(j => 
              j.status === 'อนุมัติแล้ว' && 
              j.previews?.attachment && 
              j.previews.attachment.trim() !== ''
            ).length && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                <p className="text-gray-500 mt-2">กำลังโหลดเพิ่มเติม...</p>
              </div>
            )}

            {/* End of List */}
            {displayedJobs.length === jobs.filter(j => 
              j.status === 'อนุมัติแล้ว' && 
              j.previews?.attachment && 
              j.previews.attachment.trim() !== ''
            ).length && 
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