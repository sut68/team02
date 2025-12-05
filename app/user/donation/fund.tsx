'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { PrimaryButton } from './../../components/ui/Button';
import { Card, CardContent, CardHeader } from './../../components/ui/Card';

const Tag = ({ text }: { text: string }) => (
    <span className="text-[#F26522] text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {text}
    </span>
);

export default function CentralFundDonationPage() {
    // กำหนด URL ปลายทางไว้ที่นี่เพื่อให้โค้ดอ่านง่าย
    const DONATION_URL = '/user/donation/form'; 

    return (
        <div className="mb-8">

            {/* 3. ส่วน Content (การ์ดเดียวสำหรับกองทุนกลาง) */}
            <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
                    การระดมทุน
                </h2>

                {/* 💡 ห่อทั้ง Card ด้วย Link */}
                <Link href={DONATION_URL} className="relative block group mx-auto max-w-5xl">
                    <Card className="h-full overflow-hidden p-0! rounded-2xl shadow-md bg-white flex flex-col">

                        {/* รูปภาพ (W-full, H-fixed) - ใช้ object-cover ตามที่จัดไว้ล่าสุด */}
                        <div className="relative w-full h-60 md:h-90 shrink-0">
                            <Image
                                src="/donation_poster/ChatGPT Image 20.png"
                                alt="โปสเตอร์กองทุนกลางพัฒนาวิศิษฏ์0"
                                fill
                                className="object-cover"
                                sizes="(max-width:1024px)100vw,50vw"
                            />
                        </div>

                        {/* เนื้อหา (p-5 grow) - จัดโครงสร้างใหม่ให้แสดงรายละเอียดทางการเงินและปุ่ม */}
                        <div className="p-5 grow flex flex-col justify-between"> 
                            
                            {/* ส่วนบน: ชื่อและคำอธิบาย */}
                            <div>
                                <CardHeader className="mb-2! text-lg! md:text-xl! font-semibold group-hover:text-orange-600 transition">
                                    กองทุนกลางสมาคมศิษย์เก่าวิศวกรรมศาสตร์
                                </CardHeader>
                                <CardContent className="p-0! text-sm text-gray-600 line-clamp-3">
                                    กองทุนนี้มีวัตถุประสงค์เพื่อสนับสนุนการดำเนินงานต่างๆ ของสมาคมศิษย์เก่า
                                    และคณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี
                                    เช่น กิจกรรมนักศึกษา, การพัฒนาโครงการ, และการบำรุงรักษาพื้นที่ส่วนกลาง...
                                </CardContent>

                                {/* 💡 รายละเอียดทางการเงิน (ที่ต้องการเพิ่มกลับเข้ามา) */}
                                <div className="mt-4">
                                    <div className="flex items-baseline mb-1">
                                        <span className="text-lg font-semibold text-gray-700">ยอดบริจาค:</span>
                                        <span className="text-3xl font-bold text-[#F26522] ml-2">฿15,245,670</span>
                                    </div>
                                    {/* <span className="text-gray-500 text-sm">เป้าหมาย: ฿50,000,000</span> */}
                                </div>
                            </div>

                            {/* ส่วนล่าง: ปุ่มและสถานะอัปเดต */}
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                <span>ปรับปรุงล่าสุด: {new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date())}</span>
                                <PrimaryButton>
                                    ร่วมบริจาค
                                </PrimaryButton>
                            </div>

                        </div>
                    </Card>
                </Link>

            </div>
        </div>
    );
}