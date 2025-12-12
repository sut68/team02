'use client';
import React, { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Users, ArrowLeft, MapPin } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      const foundJob = jobs.find((j: Job) => j.id === Number(params.id));
      setJob(foundJob || null);
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500 mb-4">ไม่พบข้อมูลงานประกาศนี้</p>
        <button 
           onClick={() => router.push('/user/job')}
           className="text-orange-500 hover:underline"
        >
            กลับหน้ารายการ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* ปุ่มย้อนกลับ */}
      <div className="max-w-5xl mx-auto pt-6 px-6 md:px-8">
        <button 
           onClick={() => router.push('/user/job')}
           className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors"
        >
            <ArrowLeft size={20} /> กลับหน้ารายการ
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-8">
            {/* Job Title */}
            <h1 className="text-2xl font-semibold text-[#1F2937] mb-6">
              {job.jobTitle}
            </h1>

            {/* Company Image & Overlay Logo */}
            <div className="relative w-full h-[300px] mb-4 overflow-hidden bg-[#F9FAFB] rounded-non group">
              {/* Background Image */}
              {job.previews?.image ? (
                  <img
                    src={job.previews.image}
                    alt="Company"
                    className="w-full h-full object-cover"
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    ไม่พบรูปภาพบริษัท
                  </div>
              )}

              {/* Logo Overlay (ซ้อนทับมุมซ้ายล่าง) */}
              <div className="absolute -bottom-4 left-6 translate-y-0 w-24 h-24 md:w-32 md:h-32 bg-white rounded-non shadow-md border border-gray-100 flex items-center justify-center overflow-hidden p-2 z-10">
                 {job.previews?.logo ? (
                      <img
                        src={job.previews.logo}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                  ) : (
                      <div className="text-xs text-center text-gray-400">No Logo</div>
                  )}
              </div>
            </div>
            
            {/* Company Name (อยู่ใต้รูป เว้นระยะให้ Logo ที่เกยออกมา) */}
            <div className="mb-8 pl-[110px] md:pl-[150px] min-h-[40px] flex items-center">
                 <h2 className="text-lg md:text-xl font-medium text-[#1F2937]">
                    {job.companyName || 'ไม่ระบุชื่อบริษัท'}
                 </h2>
            </div>

            {/* Job Info Card */}
            <div className="bg-[#F5F5F5] rounded-non p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#6B7280]">ตำแหน่งที่เปิดรับ</p>
                    <p className="text-base text-[#1F2937] font-medium">{job.position || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#6B7280]">เงินเดือน</p>
                    <p className="text-base text-[#1F2937] font-medium">{job.salary || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#6B7280]">จำนวน</p>
                    <p className="text-base text-[#1F2937] font-medium">{job.positions || '-'} อัตรา</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#6B7280]">สถานที่ปฏิบัติงาน</p>
                    <p className="text-base text-[#1F2937] font-medium">{job.address || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1F2937] mb-3">
                  {job.title || 'รายละเอียดงาน'}
                </h2>
                <div className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">
                  {job.title || '-'}
                </div>
              </div>

              {/* ตำแหน่งงาน (ถ้ามี) */}
              {job.position && (
                <div>
                  <h3 className="text-base font-semibold text-[#1F2937] mb-2">
                    ตำแหน่งเปิดรับ: {job.position}
                  </h3>
                </div>
              )}

              {/* คุณสมบัติผู้สมัคร */}
              <div>
                <h3 className="text-base font-semibold text-[#1F2937] mb-2">
                  คุณสมบัติ
                </h3>
                <div className="space-y-1 text-sm text-[#374151]">
                  {job.education && (
                    <p>• ระดับการศึกษา: {job.education}</p>
                  )}
                  {job.jobType && job.jobType !== 'Select Type' && (
                    <p>• ประเภทงาน: {job.jobType}</p>
                  )}
                </div>
              </div>

              {/* วิธีการเดินทาง */}
              {job.transportation && (
                <div>
                  <h3 className="text-base font-semibold text-[#1F2937] mb-2">
                    วิธีการเดินทาง
                  </h3>
                  <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">
                    {job.transportation}
                  </p>
                </div>
              )}

              {/* Contact Section */}
              <div>
                <h3 className="text-base font-semibold text-[#1F2937] mb-2">
                  ติดต่อ
                </h3>
                <div className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">
                  {job.contact || 'ไม่ระบุข้อมูลการติดต่อ'}
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}