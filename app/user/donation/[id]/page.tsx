'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
// 💡 1. นำเข้า PrimaryButton
import { PrimaryButton } from '../../../components/ui/Button';
// 💡 2. นำเข้า useRouter และ usePathname จาก next/navigation
import { useRouter, usePathname } from 'next/navigation';
// 💡 3. นำเข้า Icons จาก react-icons/fa6
import { FaShareAlt, FaUserAlt, FaClock, FaSpinner, FaRegSadCry } from 'react-icons/fa'; //npm install react-icons
import { Card } from '@/app/components/ui/Card';

// --- 1. กำหนด Type สำหรับข้อมูลโครงการบริจาค ---
interface DonationProject {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number; // ต้องมีฟิลด์นี้ใน API Response
  startDate: string;
  endDate: string;
  ownerName: string;
  contact: string;
  posterUrl: string | null;
  status: 'OPEN' | 'CLOSED' | 'FULLFILLED';
  progress: number;
  donorCount: number;
  createdAt: string;
}
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    // 💡 ใช้ minimumFractionDigits: 0 เพื่อให้ไม่มีทศนิยม
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0
  }).format(amount).replace("฿", "").trim(); // ลบสัญลักษณ์เงินออก (จะใส่เอง)
};
// --- NEW COMPONENT: Donation Progress Arc (Smile Style) ---
interface ProgressArcProps {
  currentAmount: number;
  goalAmount: number;
  progressPercent: number;
}

const DonationProgressArc: React.FC<ProgressArcProps> = ({ currentAmount, goalAmount, progressPercent }) => {

  // ฟังก์ชันจัดรูปแบบตัวเลข (มี comma, ไม่มีทศนิยม)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // จำกัด Arc ไม่ให้เกิน 100% สำหรับกราฟิก (แต่ตัวเลขแสดงตามจริงได้)
  const renderPercent = Math.min(progressPercent, 100);

  // 💡 Logic คำนวณเส้นโค้ง "รอยยิ้ม" (Smile Arc)
  const getArcPath = (percent: number) => {
    // กำหนดจุดศูนย์กลางและรัศมี
    const cx = 100; // กลางแกน X
    const cy = 20;  // แกน Y อยู่ด้านบน (เพื่อให้โค้งห้อยลงมาข้างล่าง)
    const radius = 70; // รัศมี

    const totalAngle = 120;

    const startOffset = (180 - totalAngle) / 2;
    const startAngle = 180 - startOffset;
    const endAngle = startAngle - (percent * totalAngle / 100);
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const startX = cx + radius * Math.cos(startRad);
    const startY = cy + radius * Math.sin(startRad);
    const endX = cx + radius * Math.cos(endRad);
    const endY = cy + radius * Math.sin(endRad);

    const largeArcFlag = 0;
    const sweepFlag = 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center max-w-sm mx-auto">

      <div className="relative w-[220px] h-[110px] mb-2">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">

          <text x="100" y="30" textAnchor="middle" className="fill-[#F2994A]">
            <tspan className="text-4xl font-bold">
              {formatNumber(currentAmount)}
            </tspan>
            <tspan className="text-xl" dx="5">
              บาท
            </tspan>
          </text>


          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Background Arc (สีเทาเข้มรูปยิ้ม) */}
          <path
            d={getArcPath(100)}
            fill="none"
            stroke="#808080"
            strokeWidth="20"
            strokeLinecap="round"
            className="opacity-80"
          />
          <path
            d={getArcPath(renderPercent)}
            fill="none"
            stroke="#F2994A"
            strokeWidth="20"
            strokeLinecap="round"
            filter="url(#shadow)"
          />

          {/* Text เปอร์เซ็นต์ ตรงกลางท้องช้าง */}
          <text
            x="100"
            y="95" /* ตำแหน่งแกน Y ให้อยู่ในท้องช้าง */
            textAnchor="middle"
            className="text-xl font-bold fill-white" /* สีตัวอักษรบนแถบ */
            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
          >
            {progressPercent.toFixed(0)}%
          </text>
        </svg>
      </div>

      {/* 3. ส่วนท้าย: จากเป้าหมาย */}
      <div className="mt-2">
        <p className="text-gray-500 text-sm">จากเป้าหมาย</p>
        <p className="text-2xl font-bold text-gray-600">
          {formatNumber(goalAmount)} <span className="text-lg font-normal">บาท</span>
        </p>
      </div>
    </div>
  );
};

// 💡 2. Component หน้ารายละเอียด
export default function DonationDetailPage() {
  const router = useRouter();
  const pathname = usePathname(); // e.g., '/user/donation/123'

  // ดึง ID จาก Pathname
  const projectId = pathname.split('/').pop();

  const [project, setProject] = useState<DonationProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันช่วยจัดรูปแบบตัวเลข
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
  };

  // --- useEffect สำหรับการดึงข้อมูล ---
  useEffect(() => {
    if (!projectId || isNaN(Number(projectId))) {
      setError('ไม่พบ ID โครงการที่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    const fetchProjectDetail = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/donation-project/${projectId}`);

        if (response.status === 404) {
          throw new Error('ไม่พบโครงการบริจาค');
        }
        if (!response.ok) {
          throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล');
        }

        const data = await response.json();
        setProject(data.project); // สมมติว่า API return { project: DonationProject }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('ไม่สามารถโหลดรายละเอียดโครงการได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectId]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-4xl text-[#F26522]" />
        <p className="ml-3 text-lg text-gray-700">กำลังโหลดรายละเอียดโครงการ...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-8 text-center">
        <FaRegSadCry className="text-6xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">เกิดข้อผิดพลาด</h1>
        <p className="text-lg text-gray-600 mt-2">{error || 'ไม่พบข้อมูลโครงการบริจาค'}</p>
        <PrimaryButton className="mt-6" onClick={() => router.push('/user/donation')}>
          กลับไปยังหน้ารายการ
        </PrimaryButton>
      </div>
    );
  }

  // --- Data Loaded ---
  const {
    title,
    description,
    goalAmount,
    currentAmount,
    posterUrl,
    startDate,
    endDate,
    ownerName,
    status,
    progress
  } = project;

  const isClosed = status !== 'OPEN';

  return (
    <div className="bg-white min-h-screen mb-8">
      {/* Container หลัก (จัดให้อยู่กลาง) */}
      <Card className="container mx-auto max-w-5xl p-4 md:p-8 mt-10">

        {/* 1. ชื่อโครงการ */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {title}
        </h1>

        {/* 2. โครงสร้างหลัก (2 Columns: รูปภาพ | รายละเอียด) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Column 1: รูปภาพ Poster */}
          <div className="w-full">
            <Image
              src={posterUrl || "/donation_poster/default.png"}
              alt={title}
              width={700}
              height={900}
              className="rounded-lg shadow-lg object-cover w-full"
            />
          </div>

          {/* Column 2: รายละเอียด และ ปุ่มบริจาค */}
          <div className="w-full">

            {/* 2.1 แถบ Progress */}
            <div className="rounded-lg">
              <DonationProgressArc
                currentAmount={currentAmount}
                goalAmount={goalAmount}
                progressPercent={progress}
              />
            </div>

            {/* 2.2 รายละเอียดโครงการ */}
            <div className="mt-6 text-gray-700 space-y-3">
              <p className="whitespace-pre-wrap">{description}</p>
              <p className="font-medium">
                สอบถามเพิ่มเติม: {project.contact}
              </p>
            </div>

            {/* 2.3 ตารางข้อมูลย่อย */}
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">สถานะ:</span>
                <span className={`font-medium ${isClosed ? 'text-red-600' : 'text-green-600'}`}>
                  {status === 'OPEN' ? 'เปิดรับ' : status === 'CLOSED' ? 'ปิดรับ' : 'บรรลุเป้าหมาย'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่เริ่ม:</span>
                <span className="font-medium text-gray-800">
                  {new Date(startDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันสิ้นสุด:</span>
                <span className="font-medium text-gray-800">
                  {new Date(endDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                </span>
              </div>
            </div>

            {/* 2.4 ปุ่มบริจาค */}
            <div className="mt-8 flex justify-end">
              <Link href={`/user/donation/form?projectId=${project.id}`}>
                <PrimaryButton className="py-3 text-lg" disabled={isClosed}>
                  {isClosed ? 'โครงการปิดรับบริจาค' : 'บริจาค'}
                </PrimaryButton>
              </Link>
            </div>

          </div>
        </div>

        {/* 3. แถบ Metadata (ด้านล่าง) */}
        <div className="border-t border-gray-200 mt-12 pt-4 flex flex-col md:flex-row justify-between items-center text-gray-500">
          <div className="flex space-x-4">
            <span className="flex items-center">
              <FaClock className="w-5 h-5 mr-1" />
              {new Date(project.createdAt || project.startDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
            </span>
            <button
              className="flex items-center hover:text-[#F26522] transition-colors"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <FaShareAlt className="w-5 h-5 mr-1" /> แชร์
            </button>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="flex items-center">
              <FaUserAlt className="w-5 h-5 mr-1" /> {ownerName}
            </span>
          </div>
        </div>

      </Card>
    </div>
  );
}