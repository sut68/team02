'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PrimaryButton } from './../../components/ui/Button';
import { Card } from './../../components/ui/Card';

const Tag = ({ text }: { text: string }) => (
    <span className="bg-orange-100 text-[#F26522] text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {text}
    </span>
);

export default function DonationPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    const donations = [
        {
            id: 1,
            image: '/donation_poster/donation_poster01.png',
            title: 'ใหม่! ของที่ระลึกร่วมสมทบทุนศูนย์การแพทย์',
            description: 'ร่วมบริจาคและรับของที่ระลึก "แก้ว Tumbler วิศวะ มทส." เพื่อสมทบทุนจัดซื้อเครื่องมือทางการแพทย์...',
            date: '30 ตุลาคม 2568'
        },
        {
            id: 2,
            image: '/donation_poster/donation_poster02.png',
            title: 'โครงการรับสมัครงาน มทส. (Job Fair)',
            description: 'คณะวิศวกรรมศาสตร์ เปิดรับสมัครบริษัทชั้นนำเข้าร่วม กิจกรรม Job Fair ประจำปี 2569 เพื่อเปิดโอกาสให้นักศึกษา...',
            date: '30 ตุลาคม 2568'
        },
        {
            id: 3,
            image: '/donation_poster/donation_poster01.png',
            title: 'ใหม่! ของที่ระลึกร่วมสมทบทุนศูนย์การแพทย์',
            description: 'ร่วมบริจาคและรับของที่ระลึก "แก้ว Tumbler วิศวะ มทส." เพื่อสมทบทุนจัดซื้อเครื่องมือทางการแพทย์...',
            date: '30 ตุลาคม 2568'
        }
    ];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % donations.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + donations.length) % donations.length);
    };

    return (
        // 1. Container หลักของหน้า
        <div className="min-h-screen mb-8">
            {/* 3. ส่วน Content (การ์ด) */}
            <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative mb-8">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
                    การบริจาค
                </h2>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Arrow Left */}
                    <button
                        onClick={handlePrev}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>

                    {/* Cards Container */}
                    <div className="overflow-hidden px-2 py-4">
                        <div 
                            className="flex gap-6 transition-transform duration-500 ease-in-out"
                            style={{ 
                                transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 24}px))` 
                            }}
                        >
                            {donations.map((donation) => (

                                <Card key={donation.id} className="shrink-0 w-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex">
                                    {/* รูปภาพ (ซ้าย) */}
                                    <div className="md:w-1/3 bg-white-100 flex items-center justify-center p-4">
                                        <Image
                                            src={donation.image}
                                            alt={donation.title}
                                            className="rounded-lg object-contain h-48 w-48 md:h-full md:w-full"
                                            width={300}
                                            height={300}
                                        />
                                    </div>

                                    {/* เนื้อหา (ขวา) */}
                                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                {donation.title}
                                            </h2>
                                            <p className="text-gray-600 mb-4 text-sm">
                                                {donation.description}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                                            <span>{donation.date}</span>
                                            <Link href={'/user/donation/detail'}>
                                                <PrimaryButton>
                                                    รายละเอียด
                                                </PrimaryButton>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Arrow Right */}
                    <button
                        onClick={handleNext}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                </div>
            </div>
        </div >
    );
}
