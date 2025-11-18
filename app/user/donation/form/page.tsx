'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 💡 (สมมติว่าคุณมี Component เหล่านี้ในโปรเจกต์)
const PrimaryButton = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <button className={`bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-4 py-2 rounded-lg transition ${className || ''}`}>{children}</button>
);
const CancelButton = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <button className={`border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 px-4 py-2 rounded-lg transition ${className || ''}`}>{children}</button>
);
const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <input
    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none"
    {...props}
  />
);

// 💡 ฟังก์ชันสำหรับจัดรูปแบบวันที่เป็นภาษาไทย (พ.ศ.)
const formatThaiDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Bangkok'
    }).format(date);
};

// ----------------------------------------------------
// 💡 Component หน้ารวมรายละเอียดและฟอร์ม
// ----------------------------------------------------
export default function CombinedDonationFormPage() {
  const [error, setError] = useState<string | null>(null);

  // --- Mock Data (จำลองข้อมูลจากภาพ) ---
  const current = 2185200;
  
  // 💡 ดึงวันที่ปัจจุบันและจัดรูปแบบ
  const currentDate = new Date();
  const todayInThai = formatThaiDate(currentDate);

  return (
    <div className="bg-white min-h-screen">
      {/* Container หลัก */}
      <div className="container mx-auto max-w-7xl p-4 md:p-8 mt-4">
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          ทุนช่วยเหลือศิษย์เก่าที่ขาดแคลนทุน
        </h1>

        {/* 1. โครงสร้าง Grid หลัก (3 คอลัมน์ บน Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
          
          {/* =========== COLUMN 1: รายละเอียดโครงการ (1/3) =========== */}
          <div className="md:col-span-5 space-y-6">
            
            {/* 1.1 รูปภาพ Poster */}
            <div className="w-full">
              <Image
                src="/donation_poster/donation_poster03.png" 
                alt="โปสเตอร์โครงการ"
                width={700}
                height={900} 
                className="rounded-lg shadow-lg object-cover w-full"
              />
            </div>
            
            {/* 1.2 รายละเอียดสรุป (คล้ายในหน้ารายละเอียดเดิม) */}
            <div className="text-gray-700 space-y-3">
              <p className="font-medium">
                โครงการระดมทุนการศึกษาเพื่อนักศึกษาวิชาการ...
              </p>
              <div className="text-sm">
                <p>เป้าหมาย: ฿5,000,000</p>
                <p className="text-[#F26522] font-semibold">บริจาคแล้ว: ฿{current.toLocaleString()}</p>
                <p>สถานะ: เปิดรับ</p>
              </div>
            </div>

            {/* 1.3 วันที่ */}
            <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
                <p>วันที่เริ่ม: 1 กรกฎาคม 2568</p>
                <p>วันสิ้นสุด: 31 ธันวาคม 2568</p>
            </div>
          </div>

          {/* =========== COLUMN 2: ฟอร์มข้อมูล (2/3) =========== */}
          <div className="md:col-span-5">
            
            {/* 🔶 3) หัวข้อฟอร์ม */}
            <h2 className="text-2xl font-medium text-gray-800 mb-6">
                ข้อมูลผู้บริจาค
            </h2>

            <form className="space-y-6">
                
                {/* --- ข้อมูลพื้นฐาน --- */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        {/* 🔶 4) Label ฟอร์ม */}
                        <label className="block text-sm text-gray-500 mb-2">ชื่อ (Firstname) <span className="text-red-500">*</span></label>
                        {/* 🔶 5) Input */}
                        <Input name="name" placeholder="วิชัย" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">สกุล (Lastname) <span className="text-red-500">*</span></label>
                        <Input name="fullName" placeholder="ใจดี" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-2">อีเมล (Email) <span className="text-red-500">*</span></label>
                    <Input name="email" type="email" placeholder="wichaisongs@gmail.com" required />
                </div>
                
                <div>
                    <label className="block text-sm text-gray-500 mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                    <Input name="phone" placeholder="089 638 5472" required />
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm text-gray-500 mb-2">ที่อยู่ <span className="text-red-500">*</span></label>
                    <Input name="address" placeholder="ที่อยู่" required />
                </div>

                {/* --- การอนุญาตเปิดเผยข้อมูล --- */}
                <div className="pt-4 flex items-start space-x-3 text-sm">
                    <p className="text-gray-700">ความประสงค์การเปิดเผยข้อมูล</p>
                    <div className="flex space-x-6">
                        <label className="flex items-center text-gray-500 cursor-pointer">
                            <Input type="radio" name="disclosure" value="allow" className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500" defaultChecked />
                            เปิดเผยชื่อผู้บริจาค
                        </label>
                        <label className="flex items-center text-gray-500 cursor-pointer">
                            <Input type="radio" name="disclosure" value="anonymous" className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500" />
                            ไม่ประสงค์เปิดเผยชื่อ (นามแฝง/ไม่ระบุ)
                        </label>
                    </div>
                </div>
                
                {/* --- ข้อมูลบริจาค --- */}
                <h2 className="text-2xl font-medium text-gray-800 pt-6 border-t border-gray-200 mb-6">
                    ข้อมูลบริจาค
                </h2>
                
                <div>
                    <label className="block text-sm text-gray-500 mb-2">ชื่อโครงการ</label>
                    {/* 🔶 5) Input (Disabled) */}
                    <Input name="projectName" defaultValue="ทุนช่วยเหลือศิษย์เก่าที่ขาดแคลน" disabled />
                </div>
                
                <div>
                    <label className="block text-sm text-gray-500 mb-2">จำนวนเงินที่บริจาค <span className="text-red-500">*</span></label>
                    <Input name="amount" type="number" placeholder="200000" required />
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-2">ข้อความที่ท่านฝากถึง (Optional)</label>
                    <textarea 
                        rows={3}
                        placeholder="ของส่งกำลังใจให้เด็กๆ ทุกคนเลยนะครั...บบ"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none"
                    ></textarea>
                </div>
                
                {/* --- วันที่ --- */}
                <div>
                    <label className="block text-sm text-gray-500 mb-2">วันที่บริจาค</label>
                    {/* 💡 (FIX) ใช้ todayInThai ที่จัดรูปแบบแล้ว */}
                    <Input name="donationDate" defaultValue={todayInThai} disabled />
                </div>
                
                {/* --- ปุ่ม Navigation --- */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    {/* 🔶 8) ปุ่ม “ย้อนกลับ” (เปลี่ยนเป็น Cancel) */}
                    <CancelButton className="px-8 py-3 text-sm">
                        ยกเลิก
                    </CancelButton>
                    
                    {/* 🔶 9) ปุ่ม “ถัดไป” */}
                    <PrimaryButton className="px-8 py-3 text-sm">
                        ถัดไป
                    </PrimaryButton>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}