"use client";

import React from 'react';
import { ArrowLeft, MessageCircle, Eye, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TopicDetailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับ</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section with Orange Bar */}
          <div className="relative border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-white p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-500">มทส.</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  คว้า 3 รางวัล<br/>
                  สหกิจศึกษาดีเด่นระดับชาติ
                </h1>
                <p className="text-gray-600 text-lg mb-4">
                  รางวัลประกวดผลงานสหกิจศึกษาและ<br/>
                  การศึกษาเชิงบูรณาการกับการทำงาน<br/>
                  ระดับชาติปี พ.ศ. 2567
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>245 views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>12 comments</span>
                  </span>
                  <span>เมื่อ 2 วันที่แล้ว</span>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop"
                alt="Award ceremony 1"
                className="w-full rounded-lg shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=500&fit=crop"
                alt="Award ceremony 2"
                className="w-full rounded-lg shadow-md"
              />
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                มทส. สุดเจ๋ง! คว้า 3 รางวัลสหกิจศึกษาดีเด่นระดับชาติ ตอกย้ำคุณภาพการศึกษาเชิงบูรณาการ (CWIE) แห่งปี 2567 
                มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส.) สร้างความภาคภูมิใจครั้งใหญ่ที่ได้รับความไว้วางใจเป็นประเทศชาติด้านครั้ง ด้วยการคว้า 3 รางวัลอันทรงเกียรติ 
                จากการประกวดผลงาน สหกิจศึกษาและการศึกษาเชิงบูรณาการกับการทำงาน (Cooperative and Work-Integrated Education: CWIE) ดีเด่นระดับชาติ ประจำปี พ.ศ. 2567
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                ความสำเร็จครั้งนี้ถือเป็นเครื่องพิสูจน์ถึงความมุ่งมั่นและวิสัยทัศน์ของ มทส. ที่ให้ความสำคัญกับการจัดการศึกษาที่เน้นการเรียนรู้จากการปฏิบัติงานจริง 
                (Work-Integrated Learning) ซึ่งเป็นหัวใจสำคัญของหลักสูตรสหกิจศึกษาเหมาดีเหมือนต้นหน้าวิทยาลัย โดยการศึกษาแบบ CWIE ของ มทส. 
                มุ่งเน้นการผสมผสานนักศึกษา' สมรรถนะสูง' (High Competency) และ 'พร้อมใช้' (Work Ready)
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                ตอบโจทย์ความต้องการของตลาดเกิดคุณความสมเสลาสาเสมอนงายสดอยู่เนี่ยงนกงหมองนกหมาใคหร้อย 
                รางวัลที่ได้รับครอบคลุมหลายยผี้ด้ สะท้อนถึงความเข้มแข็งของการดำเนินงานในมองกระนัน ยึดเเถะเดันนับศึกษา คณาจารยี้มีนคณาน 
                โม่มทั้งกึลคานประกอนการรั่้ความร่อนนี้อ ซีงรนมทั้งรางวัลเนปะการา้คิวู เข้ม:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                <li>นักศึกษา CWIE ดีเด่น (ด้านวิทยาศาสตร์และเทคโนโลยี)</li>
                <li>สถานประกอบการขนาดกลางด้าเนินการ CWIE ดีเด่น</li>
                <li>สถานศึกษาดำเนินการ CWIE มาเยาอด ดีเด่น (ด้านจ่งจากทอนกอมุลคำสึงเดือเนือมจอง มทส. ในปี 2567/2568)</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                การคว้า 3 รางวัลระดับชาตินครั้งนี้ ไม่เพียงแต่เป็นเกียรติระนัรฐียของเหาวยาเสเหานี้น
              </p>

              <p className="text-gray-700 leading-relaxed">
                แต่ยังเป็นแรงผลักดันสำคัญในการพัฒนาหลักสูตรและรูปแบบการเรียนการสอนแบบ CWIE ให้ทันสมัยมีเงื่นนั้น 
                เพื่อสร้างบัณฑิตที่สามารถเป็นกำลังสำคัญในการขับเคลื่อนเศรษฐกิจ สังคม และวิวัฒนรมองประเทศไทีย่างยั่งยืน
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                มทส.
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                รางวัล
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                สหกิจศึกษา
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                CWIE
              </span>
            </div>

            {/* Share and Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>แสดงความคิดเห็น</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>แชร์</span>
              </button>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">ความคิดเห็น (12)</h2>
          
          {/* Comment Input */}
          <div className="mb-6">
            <textarea
              placeholder="แสดงความคิดเห็น..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                โพสต์
              </button>
            </div>
          </div>

          {/* Sample Comments */}
          <div className="space-y-4">
            <div className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">A</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-800">นักศึกษา A</span>
                  <span className="text-sm text-gray-500">2 ชั่วโมงที่แล้ว</span>
                </div>
                <p className="text-gray-700">ยินดีด้วยครับ! ภูมิใจมาก ๆ ที่ได้เป็นส่วนหนึ่งของ มทส.</p>
              </div>
            </div>

            <div className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">B</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-800">นักศึกษา B</span>
                  <span className="text-sm text-gray-500">5 ชั่วโมงที่แล้ว</span>
                </div>
                <p className="text-gray-700">เก่งมาก! สมกับที่เป็นมหาวิทยาลัยชั้นนำของประเทศ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}