"use client";

import React, { useState } from 'react';
import { Menu, User, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SUTNewsUI() {
  const [activeTab, setActiveTab] = useState('news');
  const router = useRouter();

  const newsItems = [
    {
      id: 1,
      title: 'มทส. คว้า 3 รางวัล ผลงานวิจัยพัฒนาเด่นระดับชาติ',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop',
      tag: 'ใหม่'
    },
    {
      id: 2,
      title: 'พิธีมอบรางวัลและแสดงความยินดี',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop',
      tag: null
    },
    {
      id: 3,
      title: 'มทส. สุดเจ๋ง! คว้า 3 รางวัลสุดท้ากคิดชาติระดับชาติ ตอกย้ำคุณภาพการศึกษาเชิงนวัตกรรม',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop',
      tag: 'ใหม่'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src="/36.jpg" 
          alt="Students studying" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header with "ตั้งกระทู้ใหม่" button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-orange-500">
              Topic 5 คอมเม้นยอะสุด
            </h1>
            <button 
              onClick={() => router.push('/user/talk/create')}
              className="rounded-full"
            >
              <div
                className={
                  "relative flex items-center gap-2 px-6 py-3 rounded-full overflow-hidden " +
                  "backdrop-blur-md bg-white/10 border border-white/20 shadow-lg " +
                  "hover:scale-[1.03] transition-transform duration-200"
                }
                style={{
                  WebkitBackdropFilter: "blur(8px) saturate(120%)",
                  backdropFilter: "blur(8px) saturate(120%)",
                }}
              >
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/6 via-white/12 to-white/4 mix-blend-screen" />
                <span className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.18),transparent_30%)] blur-xl opacity-80 pointer-events-none" />
                <Plus className="w-5 h-5 text-[#F97316] z-10" />
                <span className="text-[#F97316] font-medium z-10">ตั้งกระทู้ใหม่</span>
              </div>
            </button>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Large Card */}
            <div className="space-y-6">
              {/* First large item */}
              <div 
                onClick={() => router.push('/user/talk/detail/1')}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-1 bg-orange-500"></div>
                  <div className="pl-10 pr-6 py-6">
                    <div className="text-sm text-gray-500 mb-2">มทส.</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      คว้า 3 รางวัล<br/>
                      สหกิจศึกษาดีเด่นระดับชาติ
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      รางวัลประกวดผลงานสหกิจศึกษาและการศึกษาเชิงบูรณาการกับการทำงานระดับชาติ พ.ศ. 2567
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <img 
                        src={newsItems[0].image} 
                        alt="Award ceremony 1"
                        className="w-full h-40 object-cover rounded"
                      />
                      <img 
                        src={newsItems[1].image} 
                        alt="Award ceremony 2"
                        className="w-full h-40 object-cover rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Third item */}
              <div 
                onClick={() => router.push('/user/talk/detail/3')}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        มทส. สุดเจ๋ง! ภวาด 3<br/>
                        รางวัลสหกิจศึกษาดีเด่นระดับชาติ<br/>
                        ตอกย้ำคุณภาพการศึกษาเชิงบูรณาการ
                      </h3>
                      <p className="text-sm text-orange-500 font-medium">ทั่วไป</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Numbered Items */}
            <div className="space-y-4">
              <div 
                onClick={() => router.push('/user/talk/detail/1')}
                className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 flex items-center justify-center min-h-[200px]"
              >
                <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                  1
                </div>
              </div>

              <div 
                onClick={() => router.push('/user/talk/detail/2')}
                className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 flex items-center justify-center min-h-[200px]"
              >
                <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                  2
                </div>
              </div>

              <div 
                onClick={() => router.push('/user/talk/detail/3')}
                className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 flex items-center justify-center min-h-[200px]"
              >
                <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                  3
                </div>
              </div>

              <div 
                onClick={() => router.push('/user/talk/detail/4')}
                className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 flex items-center justify-center min-h-[200px]"
              >
                <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                  4
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/user/talk/create')}
        className="fixed bottom-8 right-8 rounded-full z-50"
      >
        <div
          className={
            "relative flex items-center gap-2 px-6 py-3 rounded-full overflow-hidden " +
            "backdrop-blur-md bg-white/10 border border-white/20 shadow-lg " +
            "hover:scale-[1.03] transition-transform duration-200"
          }
          style={{
            WebkitBackdropFilter: "blur(8px) saturate(120%)",
            backdropFilter: "blur(8px) saturate(120%)",
          }}
        >
          <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/6 via-white/12 to-white/4 mix-blend-screen" />
          <span className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.18),transparent_30%)] blur-xl opacity-80 pointer-events-none" />
          <Plus className="w-5 h-5 text-[#F97316] z-10" />
          <span className="text-[#F97316] font-medium z-10">ตั้งกระทู้ใหม่</span>
        </div>
      </button>
    </div>
  );
}