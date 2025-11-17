
// app/news/News.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/Button';

// ** Mock Data **
export const mockData = {
  featured: {
    id: 1,
    title: 'Alumni Talk: "จากห้องเรียนสู่อุตสาหกรรมเทคโนโลยี"',
    desc: 'พี่ๆ ศิษย์เก่าจากหลากหลายวงการมาร่วมแบ่งปันประสบการณ์ทำงานสาย Dev, AI และ Data ให้กับรุ่นน้อง',
    slug: 'alumni-talk-2025',
    imageSrc: '/25.jpg',
  },
  secondary: {
    id: 2,
    title: 'DSA MASCOT CONTEST',
    desc: 'เชิญชวนนักศึกษาและศิษย์เก่าเข้าร่วมประกวดออกแบบมาสคอตประจำภาควิชา',
    slug: 'dsa-mascot-main',
    imageSrc: '/25.jpg',
  },
  archives: [
    {
      id: 3,
      title: '32 เลี้ยงรุ่นศิษย์เก่าวิศวกรรมขนส่ง',
      slug: 'piles-32',
      imageSrc: '/25.jpg',
    },
    {
      id: 4,
      title: '33 เลี้ยงรุ่นศิษย์เก่าวิศวกรรมขนส่ง',
      slug: 'piles-33',
      imageSrc: '/25.jpg',
    },
  ],
  upcoming: [
    { id: 5, title: 'เปิดตัวโครงการ ENGI Hackathon 2025', slug: 'hackathon', imageSrc: '/25.jpg', linkText: 'ลงทะเบียนเลย' },
    { id: 6, title: 'DSA MASCOT CONTEST', slug: 'dsa-mascot', imageSrc: '/25.jpg', linkText: 'ลงทะเบียนเลย' },
    { id: 7, title: 'ENGI Open House 2025 – วิศวะเปิดบ้านต้อนรับ', slug: 'openhouse', imageSrc: '/25.jpg', linkText: 'ลงทะเบียนเลย' },
  ],
};

export function News() {
  const { featured, secondary, archives, upcoming } = mockData;

  return (
    <section className="w-full py-10">
      
      {/* บรรทัดหัวข้อ + ปุ่มคำขอยื่นเรื่อง */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-800">
          ข่าวสารและกิจกรรม
        </h2>

        <Link
          href="/submission">
            <PrimaryButton>
                คำขอยื่นเรื่อง
            </PrimaryButton>
          
        </Link>
      </div>


      {/* ============ แถวบน ============ */}
      {/* เพิ่ม h-full ให้ grid row นี้ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr"> {/* เพิ่ม auto-rows-fr เพื่อให้ทุก grid item ใน row นี้มีความสูงเท่ากัน */}

        {/* A. Featured (ใหญ่สุด ซ้าย) */}
        <Link href={`/user/news/${featured.slug}`} className="lg:col-span-6 block group h-full"> {/* เพิ่ม h-full */}
          <Card className="h-full overflow-hidden !p-0 rounded-2xl shadow-md bg-white flex flex-col"> {/* เพิ่ม flex flex-col */}
            
            {/* รูป */}
            <div className="relative w-full h-60 md:h-72 flex-shrink-0"> {/* เพิ่ม flex-shrink-0 เพื่อให้รูปไม่ถูกบีบ */}
              <Image
                src={featured.imageSrc}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px)100vw,50vw"
              />
            </div>

            {/* เนื้อหา */}
            <div className="p-5 flex-grow"> {/* เพิ่ม flex-grow เพื่อให้เนื้อหายืดเต็มพื้นที่ที่เหลือ */}
              <CardHeader className="!mb-2 !text-lg md:!text-xl font-semibold group-hover:text-orange-600 transition">
                {featured.title}
              </CardHeader>
              <CardContent className="!p-0 text-sm text-gray-600 line-clamp-3">
                {featured.desc}
              </CardContent>
            </div>
          </Card>
        </Link>


        {/* B. Secondary (ตรงกลาง) */}
        <Link href={`/user/news/${secondary.slug}`} className="lg:col-span-3 block group h-full"> {/* เพิ่ม h-full */}
          <Card className="h-full overflow-hidden !p-0 rounded-2xl shadow-md bg-white flex flex-col"> {/* เพิ่ม flex flex-col */}
            
            <div className="relative w-full h-60 md:h-72 flex-shrink-0"> {/* เพิ่ม flex-shrink-0 */}
              <Image
                src={secondary.imageSrc}
                alt={secondary.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px)100vw,25vw"
              />
            </div> 

              {/* เนื้อหา */}
            <div className="p-5 flex-grow"> {/* เพิ่ม flex-grow */}
              <CardHeader className="!mb-2 !text-lg md:!text-xl font-semibold group-hover:text-orange-600 transition">
                {secondary.title} {/* แก้จาก featured.title เป็น secondary.title */}
              </CardHeader>
              <CardContent className="!p-0 text-sm text-gray-600 line-clamp-3">
                {secondary.desc} {/* แก้จาก featured.desc เป็น secondary.desc */}
              </CardContent>
            </div>
          </Card>
        </Link>


        {/* C. Archives (คอลัมน์ขวา แบบการ์ด 2 ใบ) */}
        {/* เพิ่ม flex flex-col h-full เพื่อให้ aside ยืดเต็มความสูง และให้ items ในนั้นจัดเรียงแบบคอลัมน์ */}
        <aside className="lg:col-span-3 space-y-6 flex flex-col h-full"> 
          {archives.map((item) => (
            <Link
              key={item.id}
              href={`/user/news/${item.slug}`}
              className="block group flex-grow" 
            >
              <Card className="overflow-hidden !p-0 rounded-2xl shadow-md bg-white flex flex-col h-full"> {/* เพิ่ม flex flex-col h-full */}

                {/* รูปด้านบน */}
                <div className="relative w-full h-32 flex-shrink-0"> {/* เพิ่ม flex-shrink-0 */}
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="20vw"
                  />
                </div>

                {/* เนื้อหาด้านล่าง */}
                <div className="p-4 flex-grow"> {/* เพิ่ม flex-grow */}
                  <p className="text-sm font-medium text-gray-800 leading-snug group-hover:text-orange-600 transition">
                    {item.title}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </aside>

      </div>



        {/* ============ แถวล่าง: Upcoming Events (แบบในรูป) ============ */}
<div className="mt-10">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

    {upcoming.slice(0, 3).map((event) => (
      <Link
        key={event.id}
        href={`/user/news/${event.slug}`}
        className="block group"
      >
        <div className="flex items-center gap-4">

          {/* รูปวงกลมด้านซ้าย */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-sm flex-shrink-0">
            <Image
              src={event.imageSrc}
              alt={event.title}
              fill
              className="object-cover"
              sizes="120px"
            />
          </div>

          {/* ข้อความด้านขวา */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-900 leading-snug group-hover:text-orange-600 transition">
              {event.title}
            </p>

            <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#F26522]">
              <span>{event.linkText}</span>
              {/* วงกลมเล็ก + ลูกศร */}
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px]">
                ↗
              </span>
            </div>
          </div>

        </div>
      </Link>
    ))}

  </div>
</div>


    </section>
  );
}


export default News;