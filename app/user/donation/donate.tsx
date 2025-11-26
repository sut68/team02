'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { PrimaryButton } from './../../components/ui/Button';
import { Card } from './../../components/ui/Card';

// 💡 Component สำหรับแสดง Tag (เช่น "กิจกรรม", "ของที่ระลึก")
const Tag = ({ text }: { text: string }) => (
    <span className="bg-orange-100 text-[#F26522] text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {text}
    </span>
);

export default function CentralFundDonationPage() {
    return (
        <div className="bg-gray-100 ">


            <div className="flex ml-8 mb-4">
                <h1 className="text-[#F26522] text-3xl md:text-5xl font-bold text-right shadow-lg">
                    การบริจาค
                </h1>
            </div>
            {/* 3. ส่วน Content (การ์ดเดียวสำหรับกองทุนกลาง) */}
            <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative">

                <Card className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex">

                    {/* รูปภาพ (ซ้าย) */}
                    <div className="md:w-1/3 bg-white-100 flex items-center justify-center p-4">
                        <Image
                            src="/donation_poster/donation_poster00.png" // 👈 ใช้รูปภาพโปสเตอร์กองทุนกลางที่สร้างใหม่
                            alt="โปสเตอร์กองทุนกลางพัฒนาวิศิษฏ์"
                            className="rounded-lg object-contain h-48 w-48 md:h-full md:w-full"
                            width={300}
                            height={300}
                        />
                    </div>

                    {/* เนื้อหา (ขวา) */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                กองทุนกลางสมาคมศิษย์เก่าวิศวกรรมศาสตร์
                            </h2>
                            <p className="text-gray-600 mb-4 text-sm">
                                กองทุนนี้มีวัตถุประสงค์เพื่อสนับสนุนการดำเนินงานต่างๆ ของสมาคมศิษย์เก่า
                                และคณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี
                                เช่น กิจกรรมนักศึกษา, การพัฒนาโครงการ, และการบำรุงรักษาพื้นที่ส่วนกลาง...
                            </p>
                            <div className="flex items-baseline mb-2">
                                {/* <span className="text-lg font-semibold text-gray-700">ยอดบริจาค:</span> */}
                                {/* <span className="text-3xl font-bold text-[#F26522] ml-2">฿15,245,670</span> */}
                            </div>
                            {/* <span className="text-gray-500 text-sm">เป้าหมาย: ฿50,000,000</span> */}
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                            <span>ปรับปรุงล่าสุด: {new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date())}</span>
                            <Link href={'/user/donation/donate-form-ui'}> {/* 💡 ลิงก์ไปยังฟอร์มบริจาค */}
                                <PrimaryButton >
                                    ร่วมบริจาค
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                </Card>

            </div>
        </div>
    );
}