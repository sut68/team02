'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import CentralFundDonationPage from './fund';
import DonationPage from './donate';

const Tag = ({ text }: { text: string }) => (
    <span className="text-[#F26522] text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {text}
    </span>
);

export default function DonationAndFundingPage() {
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
            <CentralFundDonationPage />
            <div id="donation" className="scroll-mt-28">
                <DonationPage />
            </div>
        </div >
    );
}
