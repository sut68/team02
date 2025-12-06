'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form'; // npm install react-hook-form lucide-react
import { Card } from './../../../components/ui/Card'; 
import { PrimaryButton, CancelButton } from './../../../components/ui/Button'; 
import { UploadCloud } from 'lucide-react'; 

// --------------------------------------------------------------------------
// 💡 Interfaces/Types สำหรับข้อมูลฟอร์ม
// --------------------------------------------------------------------------
interface FormData {
  projectName: string;
  fundType: string; // ประเภททุน (e.g., "ทุนการศึกษา", "ทุนวิจัย")
  targetAmount: number; // เป้าหมาย (จำนวนเงิน)
  status: string; // สถานะ (e.g., "เปิดรับ", "ปิดรับ", "รออนุมัติ")
  description: string;
  posterImage: FileList | null; // สำหรับไฟล์รูปภาพ
}

// --------------------------------------------------------------------------
// 💡 Component หลัก: หน้าสร้างโครงการ
// --------------------------------------------------------------------------
export default function CreateProjectPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ดูการเปลี่ยนแปลงของไฟล์รูปภาพ
  const watchedImage = watch("posterImage");

  // เมื่อไฟล์รูปภาพถูกเลือก
  React.useEffect(() => {
    if (watchedImage && watchedImage.length > 0) {
      const file = watchedImage[0];
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
    // Clean up object URL when component unmounts or image changes
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [watchedImage, imagePreview]);


  // 💡 Submit ฟอร์ม
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    // console.log("Form Data:", data);

    // 💡 ตัวอย่างการส่งข้อมูลไปยัง API
    const formData = new FormData();
    formData.append('projectName', data.projectName);
    formData.append('fundType', data.fundType);
    formData.append('targetAmount', data.targetAmount.toString());
    formData.append('status', data.status);
    formData.append('description', data.description);
    if (data.posterImage && data.posterImage.length > 0) {
      formData.append('posterImage', data.posterImage[0]);
    }

    try {
      const response = await fetch('/api/admin/projects', { // 💡 เปลี่ยน API Endpoint ตามจริง
        method: 'POST',
        body: formData, // ใช้ formData สำหรับส่งไฟล์
      });

      if (response.ok) {
        alert('โครงการถูกสร้างสำเร็จแล้ว!');
        router.push('/admin/projects'); // ไปหน้าแสดงรายการโครงการ
      } else {
        const errorData = await response.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.message || 'ไม่สามารถสร้างโครงการได้'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-white p-4 pt-20"> {/* เพิ่ม pt-20 เพื่อให้ไม่ชน Navbar */}
      <Card className="w-full max-w-3xl p-8 shadow-lg rounded-xl bg-white">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          สร้างโครงการใหม่
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ชื่อโครงการ */}
          <div>
            <label htmlFor="projectName" className="block text-gray-700 text-sm font-semibold mb-2">
              ชื่อโครงการ
            </label>
            <input
              type="text"
              id="projectName"
              {...register('projectName', { required: 'กรุณาระบุชื่อโครงการ' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="ทุนเรียนดี ชาววิศวะบุกเบิกทรัพย์"
            />
            {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName.message}</p>}
          </div>

          {/* ประเภททุน (Dropdown) */}
          <div>
            <label htmlFor="fundType" className="block text-gray-700 text-sm font-semibold mb-2">
              ประเภททุน
            </label>
            <select
              id="fundType"
              {...register('fundType', { required: 'กรุณาเลือกประเภททุน' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
            >
              <option value="">เลือกประเภททุน</option>
              <option value="ทุนการศึกษา">ทุนการศึกษา</option>
              <option value="ทุนวิจัย">ทุนวิจัย</option>
              <option value="กองทุนกลาง">กองทุนกลาง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
            {errors.fundType && <p className="text-red-500 text-xs mt-1">{errors.fundType.message}</p>}
          </div>

          {/* เป้าหมาย (จำนวนเงิน) */}
          <div>
            <label htmlFor="targetAmount" className="block text-gray-700 text-sm font-semibold mb-2">
              เป้าหมาย (จำนวนเงิน)
            </label>
            <input
              type="number"
              id="targetAmount"
              {...register('targetAmount', { 
                required: 'กรุณาระบุเป้าหมาย', 
                min: { value: 0, message: 'เป้าหมายต้องมากกว่า 0' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เช่น 1000000"
            />
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
          </div>

          {/* สถานะ (Dropdown) */}
          <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-semibold mb-2">
              สถานะ
            </label>
            <select
              id="status"
              {...register('status', { required: 'กรุณาเลือกสถานะ' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
            >
              <option value="">เลือกสถานะ</option>
              <option value="เปิดรับ">เปิดรับ</option>
              <option value="ปิดรับ">ปิดรับ</option>
              <option value="รออนุมัติ">รออนุมัติ</option>
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
          </div>

          {/* รายละเอียดโครงการ */}
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
              รายละเอียดโครงการ
            </label>
            <textarea
              id="description"
              {...register('description', { required: 'กรุณาระบุรายละเอียดโครงการ' })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เพื่อมอบทุนให้นักศึกษาสาขา ... ประจำปีการศึกษา 2/2568"
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* อัปโหลดโปสเตอร์ */}
          <div>
            <label htmlFor="posterImage" className="block text-gray-700 text-sm font-semibold mb-2">
              อัปโหลดโปสเตอร์
            </label>
            <div
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#F26522] transition-colors duration-200"
              onClick={() => document.getElementById('posterImage')?.click()}
            >
              {imagePreview ? (
                <div className="relative w-48 h-48">
                  <Image src={imagePreview} alt="Image Preview" fill className="object-contain" />
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">คลิกเพื่ออัปโหลด หรือลากและวางรูปภาพที่นี่</p>
                </>
              )}
              <input
                type="file"
                id="posterImage"
                {...register('posterImage', {
                  // required: 'กรุณาอัปโหลดโปสเตอร์', // อาจจะบังคับหรือไม่ก็ได้
                  validate: (value) => {
                    if (value && value.length > 0) {
                      const file = value[0];
                      const fileType = file.type;
                      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                      if (!validImageTypes.includes(fileType)) {
                        return 'กรุณาอัปโหลดไฟล์รูปภาพ (JPEG, PNG, GIF) เท่านั้น';
                      }
                    }
                    return true;
                  },
                })}
                accept="image/jpeg,image/png,image/gif"
                className="hidden" // ซ่อน input จริง
              />
            </div>
            {errors.posterImage && <p className="text-red-500 text-xs mt-1">{errors.posterImage.message}</p>}
          </div>


          {/* ปุ่ม Submit / Cancel */}
          <div className="flex justify-end space-x-4 mt-8">
            <CancelButton type="button" onClick={() => router.back()}>
              ยกเลิก
            </CancelButton>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : '+ เพิ่ม'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}