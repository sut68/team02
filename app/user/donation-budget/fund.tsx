'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { PrimaryButton } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

// 💡 1. นิยาม Interface สำหรับข้อมูลที่ได้จาก API
interface DonationProject {
    id: number;
    title: string;
    description: string;
    posterUrl: string | null;
    currentAmount?: number; // ยอดที่ได้รับ (ถ้า API ส่งมา) หรือถ้าไม่มีอาจต้องคำนวณแยก
    targetAmount?: number;   // เป้าหมาย (ถ้าต้องการแสดง)
    updatedAt: string;
    isCentralFund: boolean;
}
// Interface สำหรับ Response หลัก
interface ApiResponse {
    projects: DonationProject[];
    pagination: any;
}

export default function CentralFundDonationPage() {
    
    // 💡 2. State สำหรับเก็บข้อมูลและสถานะการโหลด
    const [centralProject, setCentralProject] = useState<DonationProject | null>(null);
    const [loading, setLoading] = useState(true);
    
    const DONATION_URL = `/user/donation-budget/from`;
    // 💡 3. Fetch ข้อมูลจาก API เมื่อ component โหลด
    useEffect(() => {
        const fetchCentralFund = async () => {
            try {
                const res = await fetch('/api/donation-project');
                if (!res.ok) throw new Error('Failed to fetch projects');
                
                const data: ApiResponse = await res.json(); // ✅ ระบุ Type เป็น ApiResponse

                // ✅ เข้าถึง array ผ่าน data.projects
                if (data.projects && Array.isArray(data.projects)) {
                    const foundProject = data.projects.find((p) => p.isCentralFund === true);
                    setCentralProject(foundProject || null);
                } else {
                    console.error("Data structure is not as expected:", data);
                }

            } catch (error) {
                console.error("Error fetching central fund:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCentralFund();
    }, []);

    // กรณีโหลดอยู่ หรือ หาไม่เจอ
    if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลกองทุนกลาง...</div>;
    if (!centralProject) return null; // หรือแสดง Placeholder ว่ายังไม่มีกองทุนกลาง

    return (
        <div className="mb-8">
            <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
                    การระดมทุน
                </h2>

                {/* 💡 ส่ง ID ไปกับ URL ด้วย (ถ้าหน้า Form รองรับ Query Param) เช่น ?projectId=1 */}
                <Link 
                    href={`${DONATION_URL}?projectId=${centralProject.id}`}
                    className="relative block group mx-auto max-w-5xl"
                >
                    <Card className="h-full overflow-hidden p-0! rounded-2xl shadow-md bg-white flex flex-col">

                        {/* รูปภาพ: ใช้ posterUrl จาก API หรือใช้รูป Default ถ้าไม่มี */}
                        <div className="relative w-full h-60 md:h-90 shrink-0 bg-gray-100">
                            <Image
                                src={centralProject.posterUrl || "/donation_poster/ChatGPT Image 20.png"}
                                alt={centralProject.title}
                                fill
                                className="object-cover"
                                sizes="(max-width:1024px)100vw,50vw"
                            />
                        </div>

                        <div className="p-5 grow flex flex-col justify-between"> 
                            
                            <div>
                                {/* ชื่อโครงการ */}
                                <CardHeader className="mb-2! text-lg! md:text-xl! font-semibold group-hover:text-orange-600 transition">
                                    {centralProject.title}
                                </CardHeader>
                                
                                {/* รายละเอียด */}
                                <CardContent className="p-0! text-sm text-gray-600 line-clamp-3">
                                    {centralProject.description}
                                </CardContent>

                                {/* ยอดบริจาค */}
                                <div className="mt-4">
                                    <div className="flex items-baseline mb-1">
                                        <span className="text-lg font-semibold text-gray-700">ยอดบริจาค:</span>
                                        <span className="text-3xl font-bold text-[#F26522] ml-2">
                                            {/* แสดงยอดเงิน ถ้าไม่มีให้แสดง 0 */}
                                            ฿{(centralProject.currentAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    {/* ถ้าต้องการแสดงเป้าหมาย ให้ Uncomment บรรทัดล่าง */}
                                    {/* {centralProject.targetAmount && (
                                        <span className="text-gray-500 text-sm">เป้าหมาย: ฿{centralProject.targetAmount.toLocaleString()}</span>
                                    )} */}
                                </div>
                            </div>

                            {/* ปุ่มและวันที่อัปเดต */}
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                <span>
                                    ปรับปรุงล่าสุด: {new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date(centralProject.updatedAt))}
                                </span>
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