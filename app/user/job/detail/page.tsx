// app/job-detail/page.tsx
import React from 'react';
import { Briefcase, DollarSign, Users } from 'lucide-react';
import Image from 'next/image';

export default function JobDetailPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-5xl mx-auto p-6 md:p-8">
            <h1 className="text-xl font-semibold text-[#1F2937] mb-4">
              ประกาศรับสมัครพนักงานบริษัท DENSO TEN (Thailand) Limited
            </h1>

            {/* Company Image */}
            <div className="relative w-full h-100 mb-4 overflow-hidden bg-[#F9FAFB]">
              <Image
                src="/examplecompanyplace.png"
                alt="Company"
                fill
                className="object-cover"
              />
            </div>

            {/* Company Logo and Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-48 h-48 flex-shrink-0">
                <Image
                  src="/Logocompany.png"
                  alt="Company Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-lg text-[#6B7280]">บริษัท DENSO TEN (Thailand) Limited</p>
              </div>
            </div>

            {/* Job Info Grid */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280]">ตำแหน่งที่เปิดรับ</p>
                  <p className="text-sm text-[#1F2937]">ข้อมูลตำแหน่งงาน</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280]">เงินเดือน  </p>
                  <p className="text-sm text-[#1F2937]">ระบุช่วงเงินเดือน / ตามตกลง</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280]">จำนวน</p>
                  <p className="text-sm text-[#1F2937]">จำนวนที่รับ</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#E5E7EB] my-6"></div>

            {/* Job Description */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-[#1F2937] mb-2">
                  ประกาศรับสมัครพนักงานบริษัท DENSO TEN (Thailand) Limited
                </h2>
                <p className="text-sm text-[#374151] leading-relaxed">
                  Our Mission: The best provider to automobile manufacturers in Thailand of our best quality products that pursue safety and pleasures, giving cooperative development and contribution through out the region
                </p>
              </div>

              <div>
                <p className="text-sm text-[#374151]">
                  ตำแหน่ง TNPS Engineer
                </p>
              </div>

              {/* Responsibilities Section */}
              <div>
                <h3 className="text-base font-medium text-[#1F2937] mb-2">
                  หน้าที่ความรับผิดชอบ
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-[#374151]">
                  <li>มุ่งมั่นในการดำเนินงานตามแผนงานของแผนก</li>
                  <li></li>
                  <li></li>
                  <li></li>
                  <li></li>
                </ol>
              </div>

              {/* Qualifications Section */}
              <div>
                <h3 className="text-base font-medium text-[#1F2937] mb-2">
                  คุณสมบัติ
                </h3>
                <div className="text-sm text-[#374151] space-y-1">
                  <p>- เพศชายหรือหญิง อายุ 22-27 ปี</p>
                  <p>- มีความรู้ด้านคอมพิวเตอร์พื้นฐานด้านซอฟต์แวร์ธุรกิจ (Word/Excel/PowerPoint)</p>
                  <p>- สามารถใช้ภาษาอังกฤษได้ดี (อ่าน, เขียน, สื่อสาร)</p>
                </div>
              </div>

              {/* Work Location Section */}
              <div>
                <h3 className="text-base font-medium text-[#1F2937] mb-2">
                  สถานที่ปฏิบัติงาน
                </h3>
                <p className="text-sm text-[#374151]">
                  ที่อยู่บริษัท
                </p>
              </div>

              {/* Contact Section */}
              <div>
                <h3 className="text-base font-medium text-[#1F2937] mb-2">
                  ติดต่อ
                </h3>
                <div className="text-sm text-[#374151] space-y-1">
                  <p>สถานที่ทำงาน:</p>
                  <p>ที่อยู่:</p>
                  <p>จังหวัด:</p>
                  <p>โทรศัพท์:</p>
                  <p>อีเมล:</p>
                  <p>LINE ID:</p>
                </div>
              </div>

              {/* Application Method Section */}
              <div>
                <h3 className="text-base font-medium text-[#1F2937] mb-2">
                  วิธีการสมัครงาน
                </h3>
                <p className="text-sm text-[#374151]">
                  รายละเอียดวิธีการสมัครงาน
                </p>
              </div>
            </div>
          </div>
        </div>
  );
}