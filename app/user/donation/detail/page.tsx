'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
// 💡 1. นำเข้า PrimaryButton
import { PrimaryButton } from './../../../components/ui/Button'; // (ปรับ Path ตามโครงสร้างของคุณ)

// 💡 ไอคอนสำหรับ Metadata (Share, User)
const ShareIcon = () => (
  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
);
const ClockIcon = () => (
  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
);


// 💡 2. Component หน้ารายละเอียด
export default function DonationDetailPage() {

  // --- Mock Data (จำลองข้อมูลจากภาพ) ---
  const goal = 5000000;
  const current = 2185200;
  const progressPercent = (current / goal) * 100;
  // -------------------------------------

  return (
    <div className="bg-white min-h-screen">
      {/* Container หลัก (จัดให้อยู่กลาง) */}
      <div className="container mx-auto max-w-5xl p-4 md:p-8 mt-4">
        
        {/* 1. ชื่อโครงการ */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          ทุนช่วยเหลือศิษย์เก่าที่ขาดแคลนทุน
        </h1>

        {/* 2. โครงสร้างหลัก (2 Columns: รูปภาพ | รายละเอียด) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: รูปภาพ Poster */}
          <div className="w-full">
            <Image
              src="/donation_poster/poster01.png" // 👈 (ใช้รูปจาก Card 1)
              alt="โปสเตอร์โครงการ"
              width={700}
              height={900} // (ปรับสัดส่วนตามจริง)
              className="rounded-lg shadow-lg object-cover w-full"
            />
          </div>

          {/* Column 2: รายละเอียด และ ปุ่มบริจาค */}
          <div className="w-full">
            
            {/* 2.1 แถบ Progress */}
            <div className="bg-gray-100 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700">
                บริจาคแล้ว
              </span>
              <span className="text-2xl font-bold text-[#F26522] ml-2">
                ฿{current.toLocaleString()}
              </span>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-300 rounded-full h-2.5 mt-3">
                <div 
                  className="bg-[#F26522] h-2.5 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{progressPercent.toFixed(0)}%</span>
                <span>เป้าหมาย: ฿{goal.toLocaleString()}</span>
              </div>
            </div>

            {/* 2.2 รายละเอียดโครงการ */}
            <div className="mt-6 text-gray-700 space-y-3">
              <p>
                โครงการระดมทุนการศึกษานี้นักศึกษามหาวิทยาลัยเทคโนโลยีสุรนารี
                ชั้นปีที่ 1 ประจำปีการศึกษา 2568 ที่เรียนดี มีความประพฤติเรียบร้อย
                แต่ขาดแคลนทุนทรัพย์ ประจำปีการศึกษา 2568...
              </p>
              <p className="font-medium">
                สอบถามเพิ่มเติม: สมาคมศิษย์เก่าสัมพันธ์วิศวกรรมศาสตร์
              </p>
            </div>

            {/* 2.3 ตารางข้อมูลย่อย */}
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">ประเภท:</span>
                <span className="font-medium text-gray-800">ทุนการศึกษา</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">สถานะ:</span>
                <span className="font-medium text-green-600">เปิดรับ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่เริ่ม:</span>
                <span className="font-medium text-gray-800">1 กรกฎาคม 2568</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันสิ้นสุด:</span>
                <span className="font-medium text-gray-800">31 ธันวาคม 2568</span>
              </div>
            </div>

            {/* 2.4 ปุ่มบริจาค */}
            <div className="mt-8">
              <Link href="/user/donation/donate-form">
                <PrimaryButton className="w-full py-3 text-lg">
                  บริจาค
                </PrimaryButton>
              </Link>
            </div>

          </div>
        </div>

        {/* 3. แถบ Metadata (ด้านล่าง) */}
        <div className="border-t border-gray-200 mt-12 pt-4 flex flex-col md:flex-row justify-between items-center text-gray-500">
          <div className="flex space-x-4">
            <span className="flex items-center"><ClockIcon /> 30 ตุลาคม 2568</span>
            <button className="flex items-center hover:text-[#F26522]"><ShareIcon /> แชร์</button>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="flex items-center"><UserIcon /> AdminNongMos-AlumniConnect</span>
          </div>
        </div>

      </div>
    </div>
  );
}
