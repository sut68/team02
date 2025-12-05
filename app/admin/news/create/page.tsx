// app/post/edit/page.tsx

'use client'; 

import { useState } from 'react';
import Link from "next/link"; // นำเข้า Link จาก Next.js
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell // นำเข้า Table components
} from '../../../components/tables/Table'; 
import { 
  Card, CardHeader, CardContent // นำเข้า Card components
} from '../../../components/ui/Card'; 
import { 
  PrimaryButton, CancelButton // นำเข้า Button components
} from '../../../components/ui/Button'; 
import { 
  Calendar, Tag, User, Save, Upload, Image as ImageIcon, Link as LinkIcon, Text 
} from 'lucide-react'; // นำเข้าไอคอน

export default function EditPostPage() {
  const [postData, setPostData] = useState({
    title: "DSA MASCOT CONTEST",
    date: "2025-12-05",
    author: "งานกิจกรรมนักศึกษา",
    status: "ร่าง",
    imageUrl: "/images/image_4b977b.png",
    body: "ขอเชิญชวนนักศึกษา ผู้เรียน และศิษย์เก่า มทส. มาร่วมสร้างสรรค์มาสคอต... \n\n[พิมพ์รายละเอียดและกติกาต่างๆ ที่นี่]",
    ctaLink: "https://forms.gle/...",
    ctaText: "ส่งผลงานทันที!",
  });
  
  const handleDataChange = (field: string, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      alert(`จำลองการอัปโหลดไฟล์: ${fileName} แล้ว`);
      handleDataChange('imageUrl', `/uploaded/${fileName}`); 
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      
      {/* HEADER: ชื่อหน้าและปุ่มหลัก "เผยแพร่" */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          สร้างโพสต์กิจกรรมใหม่
        </h1>
        {/* ใช้ PrimaryButton สำหรับการเผยแพร่หลัก */}
        <PrimaryButton onClick={() => alert('เผยแพร่โพสต์...')}>
          เผยแพร่โพสต์
        </PrimaryButton>
      </header>
      
      <div className="grid grid-cols-12 gap-6">
        
        {/* ========================================================== */}
        {/* คอลัมน์ 1: ส่วนควบคุมโพสต์ (Action Panel) */}
        {/* ========================================================== */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            
            {/* สถานะโพสต์และปุ่มหลัก - ใช้ Card */}
            <Card>
              <CardHeader className="text-lg font-semibold text-gray-700">ลงทะเบียนเข้างาน:</CardHeader>
                    <Link href="/admin/booking" passHref >
                        <CancelButton className="w-full mb-2">
                            กรอกรายละเอียด
                        </CancelButton>
                    </Link>
            </Card>

            {/* ข้อมูลเมตาโพสต์ - ใช้ Card */}
            <Card>
                <CardHeader className="text-lg font-semibold text-gray-700">วันที่เผยแพร่:</CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                      <input 
                        type="date" 
                        value={postData.date} 
                        onChange={(e) => handleDataChange('date', e.target.value)}
                        className="text-sm border-b border-gray-300 focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    {/* ... (ส่วนอื่นๆ คล้ายกัน) ... */}
                </CardContent>
            </Card>
          </div>
        </div>

        {/* ========================================================== */}
        {/* คอลัมน์ 2: ส่วนแก้ไขเนื้อหาหลัก (Content Editor) */}
        {/* ========================================================== */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
            
            {/* ส่วนหัวเรื่อง (Title Input) - ใช้ Card */}
            <Card>
                <CardContent className="p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">หัวข้อหลัก</label>
                    <input 
                      type="text" 
                      value={postData.title}
                      onChange={(e) => handleDataChange('title', e.target.value)}
                      placeholder="กรอกชื่อกิจกรรม"
                      className="w-full text-2xl font-bold p-2 border-b-2 border-gray-300 focus:border-indigo-500 outline-none transition"
                    />
                </CardContent>
            </Card>

            {/* ส่วนรูปภาพหลัก (Image Upload) - ใช้ Card */}
            <Card>
                <CardHeader className="flex items-center text-lg font-semibold text-gray-700">
                    <ImageIcon className="h-5 w-5 mr-2 text-red-500" /> รูปภาพ
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <label htmlFor="file-upload" className="block cursor-pointer border-2 border-dashed border-gray-300 p-8 text-center rounded-lg hover:border-indigo-500 transition">
                      <p className="text-gray-500 mb-2">ลากและวางรูปภาพที่นี่ หรือ</p>
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-200">
                        อัปโหลดจากคอมพิวเตอร์
                      </span>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                    {/* ... (ส่วนแสดงสถานะไฟล์) ... */}
                </CardContent>
            </Card>

            {/* ส่วนเนื้อหาหลัก (Body Text Input) - ใช้ Card */}
            <Card>
                <CardHeader className="flex items-center text-lg font-semibold text-gray-700">
                    <Text className="h-5 w-5 mr-2 text-green-500" /> รายละเอียดเนื้อหา
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <textarea 
                      value={postData.body}
                      onChange={(e) => handleDataChange('body', e.target.value)}
                      rows={10}
                      placeholder="กรอกรายละเอียด, กติกา, วันที่..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none resize-y"
                    />
                </CardContent>
            </Card>

            
        </div>

      </div>
    </div>
  );
}