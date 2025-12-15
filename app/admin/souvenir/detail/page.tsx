"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

type SouvenirFormData = {
  code: string;
  name: string;
  description: string;
  condition: string;
  quantity: number;
  status: "active" | "inactive";
  imageUrl: string;
};

export default function SouvenirDetailPage() {
  const [formData, setFormData] = useState<SouvenirFormData>({
    code: "SUT-CAP-01",
    name: "หมวกทรง Baseball สีดำเรียบหรู ปักโลโก้ We are SUT",
    description: "หมวกสีดำ ผ้า Cotton 100% ปักโลโก้ We are SUT ด้านหน้า ปรับขนาดได้",
    condition: "เข้าร่วมกิจกรรมครบ 3 ครั้ง",
    quantity: 50,
    status: "active",
    imageUrl: "/souvenir/EngiCap.png",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // TODO: API call to save data
  };

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-medium text-gray-700 mb-8">
          {formData.name}
        </h1>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Form Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* รหัสของที่ระลึก */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสของที่ระลึก
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="เช่น SUT-CAP-01"
                  />
                </div>

                {/* ชื่อของที่ระลึก */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อของที่ระลึก
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="เช่น หมวก ENGi รุ่น Baseball"
                  />
                </div>

                {/* รายละเอียด */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                    placeholder="ใส่รายละเอียดสินค้า เช่น วัสดุ, ขนาด, สี ฯลฯ"
                  />
                </div>

                {/* เงื่อนไขการรับสิทธิ์ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เงื่อนไขการรับสิทธิ์
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="เข้าร่วมกิจกรรมครบ 3 ครั้ง">เข้าร่วมกิจกรรมครบ 3 ครั้ง</option>
                    <option value="บริจาคเกิน 300 บาท">บริจาคเกิน 300 บาท</option>
                    <option value="เป็นศิษย์เก่าที่ลงทะเบียนแล้ว">เป็นศิษย์เก่าที่ลงทะเบียนแล้ว</option>
                    <option value="ไม่มีเงื่อนไข">ไม่มีเงื่อนไข</option>
                  </select>
                </div>

                {/* จำนวน */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จำนวน (ชิ้น)
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="เช่น 50"
                  />
                </div>

                {/* สถานะ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CENTER: Product Image */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
              <div className="relative h-72 md:h-80 bg-white flex items-center justify-center rounded-2xl overflow-hidden mb-4">
                <Image
                  src={formData.imageUrl}
                  alt={formData.name}
                  width={600}
                  height={600}
                  className="max-h-[75%] w-auto object-contain"
                  priority
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition font-semibold">
                <Upload className="w-5 h-5" />
                เปลี่ยนรูปภาพ
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
