"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

type SouvenirFormData = {
  code: string;
  name: string;
  description: string;
  condition: "activity" | "donation";
  quantity: number;
  status: "active" | "inactive";
  imageUrl: string;
};

export function SouvenirDetailForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SouvenirFormData>({
    code: "SUT-CAP-01",
    name: "หมวกทรง Baseball สีดำเรียบหรู ปักโลโก้ We are SUT",
    description: "หมวกสีดำ ผ้า Cotton 100% ปักโลโก้ We are SUT ด้านหน้า ปรับขนาดได้",
    condition: "activity",
    quantity: 50,
    status: "active",
    imageUrl: "/souvenir/EngiCap.png",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    setIsEditing(false);
    // TODO: API call to save data
  };

  return (
    <section className="w-full bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Title + Edit Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {formData.name}
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              แก้ไขข้อมูล
            </button>
          )}
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Form Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
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
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:cursor-not-allowed"
                    placeholder="เช่น SV001"
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
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:cursor-not-allowed"
                    placeholder="เช่น เข็มกลัด SUT"
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
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none disabled:cursor-not-allowed"
                    placeholder="ใส่รายละเอียดสินค้า เช่น วัสดุ, ขนาด, สี ฯลฯ"
                  />
                </div>

                {/* เงื่อนไขการรับสิทธิ์ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เงื่อนไขการรับสิทธิ์ (เชื่อมไปหน้า)
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as "activity" | "donation" })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none bg-white disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="activity">กิจกรรม (Activity)</option>
                    <option value="donation">บริจาค (Donation)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    เลือกว่าสินค้านี้จะแสดงในหน้ากิจกรรมหรือบริจาคฝั่ง User
                  </p>
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
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:cursor-not-allowed"
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
                    disabled={!isEditing}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none bg-white disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>

                {/* Submit Button */}
                {isEditing && (
                  <div className="pt-4 flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
                    >
                      บันทึกข้อมูล
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition shadow-md"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT: Product Image */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center border border-gray-200 h-full">
              <div className="relative w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4">
                <Image
                  src={formData.imageUrl}
                  alt={formData.name}
                  fill
                  className="object-contain p-8"
                />
              </div>
              <button 
                disabled={!isEditing}
                className="flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition font-semibold mt-auto disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-5 h-5" />
                เปลี่ยนรูปภาพ
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SouvenirDetailForm;
