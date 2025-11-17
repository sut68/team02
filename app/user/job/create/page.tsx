// app/tools/page.tsx
import React from 'react';
import { Calendar, User, Menu } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
           
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative w-full h-150">
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
              className="bg-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-56 h-64 bg-white flex-shrink-0 overflow-hidden relative">
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-700 mb-6 flex-1 whitespace-pre-line leading-relaxed">
                    {card.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
                      อ่านต่อ...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}