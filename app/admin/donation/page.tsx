'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { PrimaryButton } from './../../components/ui/Button';
import DonationPage from '@/app/user/donation/donate';
import CentralDonationPage from '@/app/user/donation-budget/fund';


const Tag = ({ text }: { text: string }) => (
    <span className="text-[#F26522] text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {text}
    </span>
);

export default function CentralFundDonationPage() {

    const ADD_PROJECT_URL = '/admin/donation/create';

    return (
        
        <div className="min-h-screen mb-6 ">
             <div className="relative w-full h-[400px] bg-gray-800 mb-4">
                            <Image
                                src="/donation_poster/00.png"
                                alt="นักศึกษาวิศวกรรมศาสตร์ สุรนารี"
                                layout="fill"
                                objectFit="cover"
                                className="opacity-60"
                            />
                            <div className="absolute inset-0 flex items-end justify-end p-8 md:p-16">
                                <h1 className="text-white text-3xl md:text-5xl font-bold text-right shadow-lg">
                                    ระดมทุนและบริจาค
                                </h1>
                            </div>
                        </div>
            <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative">
                <div className="flex justify-end items-center mb-6">
                    <Link href={ADD_PROJECT_URL}>
                        <PrimaryButton className="text-sm md:text-base px-3 py-1.5">
                            + เพิ่มโครงการ
                        </PrimaryButton>
                    </Link>

                </div>
            </div>
                <CentralDonationPage />
            <div id="donation" className="scroll-mt-28">
                <DonationPage />
            </div>
        </div>
    );
}