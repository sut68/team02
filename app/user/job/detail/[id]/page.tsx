'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, DollarSign, Users, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

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
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/job/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลงาน');
      }

      setJob(data.job);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setError(errorMessage);
      console.error('Error loading job:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent'></div>
          <p className='text-gray-500 mt-2'>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <p className='text-xl text-gray-500 mb-4'>
          {error || 'ไม่พบข้อมูลงานประกาศนี้'}
        </p>
        <button
          onClick={() => router.push('/user/job')}
          className='px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors'
        >
          กลับหน้ารายการ
        </button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#FFFFFF]'>
      {/* ปุ่มย้อนกลับ */}
      <div className='max-w-5xl mx-auto pt-6 px-6 md:px-8'>
        <button
          onClick={() => router.push('/user/job')}
          className='flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors'
        >
          <ArrowLeft size={20} /> กลับหน้ารายการ
        </button>
      </div>

      <div className='max-w-5xl mx-auto p-6 md:p-8'>
        {/* Job Title */}
        <h1 className='text-2xl font-semibold text-[#1F2937] mb-6'>
          {job.title || job.namejob || 'ไม่มีชื่องาน'}
        </h1>

        {/* Company Image & Overlay Logo */}
        <div className='relative w-full h-[300px] mb-4 overflow-hidden bg-[#F9FAFB] rounded-non group'>
          {/* Background Image */}
          {job.company?.CompanyPicturePath ? (
            <img
              src={job.company.CompanyPicturePath}
              alt='Company'
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-gray-400 bg-gray-100'>
              ไม่พบรูปภาพบริษัท
            </div>
          )}

          {/* Logo Overlay (ซ้อนทับมุมซ้ายล่าง) */}
          {/* แก้ไข: เปลี่ยน rounded-lg เป็น rounded-none เพื่อให้กรอบเป็นเหลี่ยม */}
          <div className='absolute -bottom-4 left-6 translate-y-0 w-24 h-24 md:w-32 md:h-32 bg-white rounded-non shadow-md border border-gray-100 flex items-center justify-center overflow-hidden p-2 z-10'>
            {job.company?.CompanyLogoPath ? (
              <img
                src={job.company.CompanyLogoPath}
                alt='Company Logo'
                className='w-full h-full object-contain'
              />
            ) : (
              <div className='text-xs text-center text-gray-400'>No Logo</div>
            )}
          </div>
        </div>

        {/* Company Name (อยู่ใต้รูป เว้นระยะให้ Logo ที่เกยออกมา) */}
        <div className='mb-8 pl-[110px] md:pl-[150px] min-h-[40px] flex items-center'>
          <h2 className='text-lg md:text-xl font-medium text-[#1F2937]'>
            {job.company?.companyname || 'ไม่ระบุชื่อบริษัท'}
          </h2>
        </div>

        {/* Job Info Card */}
        <div className='bg-[#F5F5F5] rounded-non p-6 mb-6'>
          <div className='space-y-4'>
            <div className='flex items-start gap-3'>
              <Briefcase className='w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm text-[#6B7280]'>ตำแหน่งที่เปิดรับ</p>
                <p className='text-base text-[#1F2937] font-medium'>
                  {job.position || '-'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <DollarSign className='w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm text-[#6B7280]'>เงินเดือน</p>
                <p className='text-base text-[#1F2937] font-medium'>
                  {job.salarydetail || '-'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Users className='w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm text-[#6B7280]'>จำนวน</p>
                <p className='text-base text-[#1F2937] font-medium'>
                  {job.numpositions ? `${job.numpositions} อัตรา` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className='space-y-6'>
          <div>
            <h2 className='text-lg font-semibold text-[#1F2937] mb-3'>
              รายละเอียดงาน
            </h2>
            <div className='text-sm text-[#374151] leading-relaxed whitespace-pre-line'>
              {job.namejob || job.title || '-'}
            </div>
          </div>

          {/* ตำแหน่งงาน (ถ้ามี) */}
          {job.position && (
            <div>
              <h3 className='text-base font-semibold text-[#1F2937] mb-2'>
                ตำแหน่งเปิดรับ: {job.position}
              </h3>
            </div>
          )}

          {/* ที่อยู่/สถานที่ */}
          {job.location && (
            <div>
              <h3 className='text-base font-semibold text-[#1F2937] mb-2'>
                ที่อยู่/สถานที่
              </h3>
              <p className='text-sm text-[#374151] whitespace-pre-line leading-relaxed'>
                {job.location}
              </p>
            </div>
          )}

          {/* คุณสมบัติผู้สมัคร */}
          {job.qualification && (
            <div>
              <h3 className='text-base font-semibold text-[#1F2937] mb-2'>
                คุณสมบัติ
              </h3>
              <div className='space-y-1 text-sm text-[#374151] whitespace-pre-line leading-relaxed'>
                {job.qualification}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {job.contactInfo && (
            <div>
              <h3 className='text-base font-semibold text-[#1F2937] mb-2'>
                ติดต่อ
              </h3>
              <div className='text-sm text-[#374151] whitespace-pre-line leading-relaxed'>
                {job.contactInfo}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
