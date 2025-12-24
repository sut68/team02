"use client";

import React, { useState, ChangeEvent } from 'react'; // ✅ เพิ่ม ChangeEvent
import { X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTopicForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  // กำหนด Type ให้ state image (อาจจะเป็น File หรือ null)
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const router = useRouter();

  // ✅ แก้ไข: ระบุ Type ของ e ให้ชัดเจนว่าเป็น ChangeEvent ของ input
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // ใช้ ? เพื่อกัน Error กรณี files เป็น null
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    console.log({
      title,
      content,
      category,
      image
    });
    // Handle form submission
    // TODO: Save to database here
    
    // Navigate to talk page after submission
    router.push('/user/talk');
  };

  const handleCancel = () => {
    router.push('/user/talk');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-8">ตั้งกระทู้ใหม่</h1>

          {/* Form */}
          <div className="space-y-6">
            {/* หัวข้อกระทู้ */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                หัวข้อกระทู้
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                placeholder="กรอกหัวข้อกระทู้"
              />
            </div>

            {/* เนื้อหากระทู้ */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                เนื้อหากระทู้
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="กรอกเนื้อหากระทู้"
              />
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                หมวดหมู่
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  <option value="general">ทั่วไป</option>
                  <option value="education">การศึกษา</option>
                  <option value="technology">เทคโนโลยี</option>
                  <option value="news">ข่าวสาร</option>
                  <option value="sports">กีฬา</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* รูปภาพ */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                รูปภาพ
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setImage(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 text-white py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
              >
                ตั้งกระทู้เลย
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}