import Link from 'next/link';
import React from 'react';
import Image from "next/image";
import { News } from './user/news/page';

export default function HomePage() {
  return (
    <>
      {/* 🔶 Full-width Banner */}
      <div className="w-full h-[420px] relative">
        <Image
          src="/25.jpg"
          alt="Home"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* 🔶 ส่วนเนื้อหาใน container */}
      <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-128px)]">
        <News />

        <h1 className="text-5xl font-extrabold text-gray-800 mb-4 text-center">
          🎉 ยินดีต้อนรับสู่เว็บไซต์อย่างเป็นทางการ 🎉
        </h1>

        <p className="text-xl text-gray-600 mb-8 text-center max-w-3xl mx-auto">
          เราคือศูนย์กลางการระดมทุน การบริจาค และการแลกเปลี่ยนข้อมูลที่โปร่งใส
        </p>
      </div>
    </>
  );
}