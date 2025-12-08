// app/tools/page.tsx
import Link from 'next/link';
import React from 'react';
import { Calendar, User, Menu, Plus } from 'lucide-react';
import Image from 'next/image';

export default function ToolsPage() {
  const cards = [
    {
      id: 1,
      title: "ประกาศรับสมัครงาน บริษัท....",
      description: "ประกาศรับสมัครพนักงานบริษัท DENSO TEN (Thailand) Limited\nOur Mission: The best provider to automobile manufacturers in Thailand of our best quality products ...",
      date: "01 พ.ค. 2566",
      author: "ความยาว.ส"
    },
    {
      id: 2,
      title: "ประกาศรับสมัครงาน บริษัท....",
      description: "ประกาศรับสมัครพนักงานบริษัท DENSO TEN (Thailand) Limited\nOur Mission: The best provider to automobile manufacturers in Thailand of our best quality products ...",
      date: "01 พ.ค. 2566",
      author: "ความยาว.ส"
    },
    {
      id: 3,
      title: "บริษัท ว.ชี.เอส.(ไทยแลนด์) จำกัดรับสมัคร วิศวกร ทุกสาขา 10ตำแหน่ง ด่วน!",
      description: "บริษัท ว.ชี.เอส (ไทยแลนด์) จำกัดรับสมัคร วิศวกร ทุกสาขา #10ตำแหน่ง ด่วน!\nเพื่อเข้าทำงานบริษัทฯด้านการเริ่มรับงานภาพ QC\nสนใจติดต่อ :- คุณสมชัย อีเมวช์ลต์สผู\n(เช้อความละเอียดของผู้สมัคร, สวัสดิ และ สัมภาษณ์กับ โรคศัพท์)",
      date: "01 พ.ค. 2566",
      author: "ความยาว.ส"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
     

      {/* Hero Banner */}
      <div className="relative w-full h-100">
        <Image
          src="/17.jpg"
          alt="Hero Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-[#F5F5F5] rounded-none shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-56 h-64 bg-[#FFFFFF] rounded-lg flex-shrink-0 overflow-hidden relative">
                  <Image
                    src="/Poster1.png"
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-[#111827] mb-3">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#374151] mb-6 flex-1 whitespace-pre-line leading-relaxed">
                    {card.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#4B5563]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{card.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{card.author}</span>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <Link
                      href={`/user/job/detail/`}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full text-sm font-medium transition-colors inline-block"
                    >
                      อ่านต่อ...
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button - Liquid Glass */}
      <Link
        href="/user/job/create"
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
          {/* soft gradient overlay to give "liquid" feel */}
          <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/6 via-white/12 to-white/4 mix-blend-screen" />
          {/* subtle colored blob */}
          <span className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.18),transparent_30%)] blur-xl opacity-80 pointer-events-none" />
          <Plus className="w-5 h-5 text-[#F97316] z-10" />
          <span className="text-[#F97316] font-medium z-10">สร้างประกาศ</span>
        </div>
      </Link>
    </div>
  );
}