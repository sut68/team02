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

// 💡 (FIX) แก้ไขชื่อ Component ให้เป็น PascalCase
export default function DonationPage() {
    return (
        // 1. Container หลักของหน้า (ใช้สีพื้นหลังอ่อนๆ เหมือนในดีไซน์)
        <div className="bg-gray-100 min-h-screen mb">

            {/* 2. ส่วน Hero Image (ภาพนักศึกษา) */}
            <div className="relative w-full h-[300px] md:h-[500px] bg-gray-800">
                {/* 💡 หมายเหตุ: คุณต้องใช้รูปภาพจริงมาแทนที่ placeholder */}
                <Image
                    src="/donation.jpeg" // 👈 1. Placeholder สำหรับ Hero
                    alt="นักศึกษาวิศวกรรมศาสตร์ สุรนารี"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-60" // 💡 ลดความสว่างภาพเพื่อให้ข้อความเด่น
                />
                {/* ข้อความบน Hero (ตามใน Figma) */}
                <div className="absolute inset-0 flex items-end justify-end p-8 md:p-16">
                    <h1 className="text-white text-3xl md:text-5xl font-bold text-right shadow-lg">
                        ระดมทุนและบริจาค
                    </h1>
                </div>
            </div>

            {/* 3. ส่วน Content (การ์ด) */}
            <div className="container mx-auto max-w-[1440px] p-4 md:p-8 z-10 relative">

                <Card className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex mb-8">

                    {/* รูปภาพ (ซ้าย) */}
                    <div className="md:w-1/3 bg-white-100 flex items-center justify-center p-4">
                        <Image
                            src="/donation_poster/class350.png"
                            alt="ของที่ระลึก"
                            className="rounded-lg object-contain h-48 w-48 md:h-full md:w-full"
                            width={300}
                            height={300}
                        />
                    </div>

                    {/* เนื้อหา (ขวา) */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                ใหม่! ของที่ระลึกร่วมสมทบทุนศูนย์การแพทย์
                            </h2>
                            <p className="text-gray-600 mb-4 text-sm">
                                ร่วมบริจาคและรับของที่ระลึก "แก้ว Tumbler วิศวะ มทส."
                                เพื่อสมทบทุนจัดซื้อเครื่องมือทางการแพทย์...
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                            <span>30 ตุลาคม 2568</span>
                            <Link href={'/user/donation/detail'}>
                                <PrimaryButton >
                                    รายละเอียด
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                </Card>

                {/* 💡 2. (FIX) เปลี่ยนจาก <div> เป็น <Card> */}
                <Card className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex mb-8">

                    {/* รูปภาพ (ซ้าย) */}
                    <div className="md:w-1/3 bg-white-100 flex items-center justify-center p-4">
                        <Image
                            src="/donation_poster/poster02.png"
                            alt="project_poster"
                            className="rounded-lg object-contain h-48 w-48 md:h-full md:w-full"
                            width={300}
                            height={300}
                        />
                    </div>

                    {/* เนื้อหา (ขวา) */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                โครงการรับสมัครงาน มทส. (Job Fair)
                            </h2>
                            <p className="text-gray-600 mb-4 text-sm">
                                คณะวิศวกรรมศาสตร์ เปิดรับสมัครบริษัทชั้นนำเข้าร่วม
                                กิจกรรม Job Fair ประจำปี 2569 เพื่อเปิดโอกาสให้นักศึกษา...
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                            <span>30 ตุลาคม 2568</span>
                            <Link href={'/user/donation/detail'}>
                                <PrimaryButton >
                                    รายละเอียด
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                </Card>

                <Card className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex mb-8">

                    {/* รูปภาพ (ซ้าย) */}
                    <div className="md:w-1/3 bg-white-100 flex items-center justify-center p-4">
                        <Image
                            src="/donation_poster/class350.png"
                            alt="ของที่ระลึก"
                            className="rounded-lg object-contain h-48 w-48 md:h-full md:w-full"
                            width={300}
                            height={300}
                        />
                    </div>

                    {/* เนื้อหา (ขวา) */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                ใหม่! ของที่ระลึกร่วมสมทบทุนศูนย์การแพทย์
                            </h2>
                            <p className="text-gray-600 mb-4 text-sm">
                                ร่วมบริจาคและรับของที่ระลึก "แก้ว Tumbler วิศวะ มทส."
                                เพื่อสมทบทุนจัดซื้อเครื่องมือทางการแพทย์...
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                            <span>30 ตุลาคม 2568</span>
                            <Link href={'/user/donation/detail'}>
                                <PrimaryButton >
                                    รายละเอียด
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                </Card>


            </div>
        </div>
    );
}
