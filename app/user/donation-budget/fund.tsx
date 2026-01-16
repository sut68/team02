'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { PrimaryButton } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

interface DonationProject {
    id: number;
    title: string;
    description: string;
    posterUrl: string | null;
    currentAmount: number;
    updatedAt: string;
    endDate: string;
    projectType: string;    
}

interface ApiResponse {
    projects: DonationProject[];
    pagination: any;
}

export default function CentralDonationPage() {

    const [centralProject, setCentralProject] = useState<DonationProject | null>(null);
    const [loading, setLoading] = useState(true);

    const DONATION_URL = `/user/donation-budget/from`;

    useEffect(() => {
        const fetchCentralFund = async () => {
            try {
                const res = await fetch('/api/donation-project?filter=active');

                if (!res.ok) throw new Error('Failed to fetch projects');

                const data: ApiResponse = await res.json();

                if (data.projects && Array.isArray(data.projects)) {
                    const foundProject = data.projects.find((p) => p.projectType === 'CENTRAL');
                    setCentralProject(foundProject || null);
                }

            } catch (error) {
                console.error("Error fetching central fund:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCentralFund();
    }, []);

    // Loading State
    if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลกองทุนกลาง...</div>;

    if (!centralProject) return null;

    return (

        <div className="py-4">
            <div className="container mx-auto mb-2 px-4 py-0">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
                    การระดมทุน
                </h2>
                    <p className="text-gray-500">ร่วมเป็นส่วนหนึ่งในการสนับสนุนกิจกรรมและช่วยเหลือพี่น้องชาววิศวะ</p>
                <Link
                    href={`${DONATION_URL}?projectId=${centralProject.id}`}
                    className="relative block group mx-auto max-w-7xl"
                >
                    <Card className="h-full overflow-hidden p-0! rounded-2xl shadow-md bg-white  m-5 flex flex-col">

                        {/* ส่วนรูปภาพ */}
                        <div className="relative w-full h-60 md:h-90 shrink-0 bg-gray-100">
                            <Image
                                src={centralProject.posterUrl || "/donation_poster/default-poster.png"}
                                alt={centralProject.title}
                                fill
                                className="object-cover"
                                sizes="(max-width:1024px)100vw,50vw"
                            />
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                                เปิดรับบริจาค
                            </div>
                        </div>

                        <div className="p-5 grow flex flex-col justify-between">

                            <div>
                                <CardHeader className="mb-2! text-lg! md:text-xl! font-semibold group-hover:text-orange-600 transition">
                                    {centralProject.title}
                                </CardHeader>

                                <CardContent className="p-0! text-sm text-gray-600 line-clamp-3">
                                    {centralProject.description}
                                </CardContent>

                                <div className="mt-4">
                                    <div className="flex items-baseline mb-1">
                                        <span className="text-lg font-semibold text-gray-700">ยอดบริจาค:</span>
                                        <span className="text-3xl font-bold text-[#F26522] ml-2">
                                            ฿{(centralProject.currentAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                <span className="text-orange-600 font-medium">
                                    หมดเขต: {new Intl.DateTimeFormat('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }).format(new Date(centralProject.endDate))}
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