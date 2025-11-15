// app/news/NewsActivitySection.tsx
// (หรือชื่อไฟล์ที่คุณใช้เก็บ Component นี้)

import Image from 'next/image';
import Link from 'next/link';
// ตรวจสอบ Path Card Component ของคุณให้ถูกต้อง
import { Card, CardHeader, CardContent } from '../../components/ui/Card'; 

// ** Mock Data (สำหรับแสดงผลให้ครบตาม Layout) **
const mockData = {
    featured: {
        id: 1,
        title: 'Alumni Talk: "จากห้องเรียนสู่อุตสาหกรรมเทคโนโลยี"',
        desc: 'พี่ๆ ศิษย์เก่าจากหลากหลายวงการมาร่วมแบ่งปันประสบการณ์ทำงานสาย Dev, AI และ Data ให้กับรุ่นน้อง',
        slug: 'alumni-talk-2025',
        imageSrc: '/images/alumni-talk-placeholder.png', 
    },
    secondary: {
        id: 2,
        title: 'DSA MASCOT CONTEST',
        desc: 'ชิญชวนนิสิตนักศึกษาและศิษย์เก่า ประกวดออกแบบมาสคอต',
        slug: 'dsa-mascot-main',
        imageSrc: '/images/dsa-mascot-main-placeholder.png', 
    },
    archives: [
        { id: 3, title: '32 เสาเข็มที่เฝ้าวิศวกรรมมั่นคง', slug: 'piles-32', imageSrc: '/images/archive-piles-placeholder.png' },
        { id: 4, title: '33 เสาเข็มที่เฝ้าวิศวกรรมมั่นคง', slug: 'piles-33', imageSrc: '/images/archive-piles-placeholder.png' },
    ],
    upcoming: [
        { id: 5, title: 'เปิดตัวโครงการ ENGI Hackathon 2025', slug: 'hackathon', imageSrc: '/images/hackathon-placeholder.png', linkText: 'ลงทะเบียนเลย' },
        { id: 6, title: 'DSA MASCOT CONTEST', slug: 'dsa-mascot', imageSrc: '/images/dsa-mascot-placeholder.png', linkText: 'ลงทะเบียนเลย' },
        { id: 7, title: 'ENGI Open House 2025 – วิศวะเปิดบ้านต้อนรับ', slug: 'openhouse', imageSrc: '/images/openhouse-placeholder.png', linkText: 'ลงทะเบียนเลย' },
        { id: 8, title: 'AI for Engineering Workshop 2025', slug: 'ai-workshop', imageSrc: '/images/ai-workshop-placeholder.png', linkText: 'ลงทะเบียนเลย' },
    ]
};

export function News() { 
    const { featured, secondary, archives, upcoming } = mockData;

    return (
        <div className="container mx-auto px-4 py-10"> 
            
            <h1 className="text-4xl font-normal text-gray-800 mb-8">ข่าวสารและกิจกรรม</h1>
            
            {/* 1. ส่วนรายการข่าวหลัก (Grid 4 คอลัมน์) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* A. ข่าวเด่นหลัก (Featured - 2/4 คอลัมน์) */}
                <Link href={`/news/${featured.slug}`} className="lg:col-span-2 block group">
                    <Card className="h-full overflow-hidden !p-0">
                        {/* รูปภาพใหญ่: h-auto w-full */}
                        <div className="relative w-full h-80">
                            <Image src={featured.imageSrc} alt={featured.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                        </div>
                        <div className="p-4">
                            <CardHeader className="!mb-1 !text-2xl font-semibold">{featured.title}</CardHeader>
                            <CardContent className="text-base line-clamp-3">{featured.desc}</CardContent>
                        </div>
                    </Card>
                </Link>

                {/* B. ส่วนกลาง (Secondary + Sidebar Archive - 2/4 คอลัมน์) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* B1. Secondary Feature Card (ซ้ายบน) */}
                    <Link href={`/news/${secondary.slug}`} className="block group">
                        <Card className="h-full overflow-hidden !p-0">
                            <div className="relative w-full h-80">
                                <Image src={secondary.imageSrc} alt={secondary.title} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                                {/* Overlay Text */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                    <h3 className="text-xl font-bold text-white">{secondary.title}</h3>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-600 text-sm line-clamp-3">{secondary.desc}</p>
                            </div>
                        </Card>
                    </Link>
                    
                    {/* B2. คลังเก็บเรื่อง (ขวาบน) */}
                    <aside className="space-y-4">
                        <div className="bg-orange-600 text-white py-2 px-4 font-normal text-lg rounded-t-lg text-center">คลังเก็บเรื่อง</div>
                        
                        <div className="space-y-2 border border-t-0 rounded-b-lg p-2 bg-white shadow-sm">
                            {archives.map(item => (
                                <Link key={item.id} href={`/news/${item.slug}`} className="flex items-start space-x-3 group p-2 hover:bg-gray-50 rounded transition">
                                    <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                                        <Image src={item.imageSrc} alt={item.title} fill className="object-cover" sizes="64px" />
                                    </div>
                                    <p className="text-sm font-medium leading-tight text-gray-800 group-hover:text-orange-600">
                                        {item.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div> 
            </div> 
            
            {/* 2. ส่วนกิจกรรมเพิ่มเติม (Upcoming Events) */}
            <div className="mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    
                    {upcoming.map(event => (
                        <Link key={event.id} href={`/news/${event.slug}`} className="block group hover:no-underline">
                            <Card className="h-full overflow-hidden !p-0">
                                
                                <div className="relative w-full h-36">
                                    <Image src={event.imageSrc} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                                </div>
                                
                                <div className="p-3">
                                    <p className="text-base font-medium line-clamp-2 text-gray-800 mb-1">
                                        {event.title}
                                    </p>
                                    <span className="text-xs font-bold text-orange-600">
                                        {event.linkText} &rarr;
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}