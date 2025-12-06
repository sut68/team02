'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form'; 
import { Card } from './../../../components/ui/Card'; 
import { PrimaryButton, CancelButton } from './../../../components/ui/Button'; 
import { UploadCloud } from 'lucide-react'; 

// --------------------------------------------------------------------------
// 💡 Interfaces/Types สำหรับข้อมูลฟอร์ม
// --------------------------------------------------------------------------
interface FormData {
  projectName: string;
  fundType: string; 
  targetAmount: number;
  status: string; 
  description: string;
  startDate: string;
  endDate: string;
  posterImage: FileList | null;
}

// --------------------------------------------------------------------------
// 💡 Component หลัก: หน้าสร้างโครงการ
// --------------------------------------------------------------------------
export default function CreateProjectPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const watchedImage = watch("posterImage");
  
  // 💡 State สำหรับเก็บ File Object ที่พร้อมอัปโหลด
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  

  // เมื่อไฟล์รูปภาพถูกเลือก
  useEffect(() => {
    let objectUrl: string | null = null;
    
    if (watchedImage && watchedImage.length > 0) {
      const file = watchedImage[0];
      setFileToUpload(file);
      
      objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setFileToUpload(null);
      setImagePreview(null);
    }
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchedImage]);


  // 💡 ฟังก์ชันแยก: อัปโหลดรูปภาพไปยัง Backend และคืนค่า URL
  const uploadPoster = async (file: File): Promise<string> => {
    const uploadFormData = new window.FormData();
    uploadFormData.append('file', file);
    
    // 💡 (TODO: เปลี่ยนเป็น API Route สำหรับอัปโหลดไฟล์จริง)
    const uploadResponse = await fetch('/api/admin/upload-poster', {
      method: 'POST',
      body: uploadFormData, // ส่ง FormData (ไม่ใช่ JSON)
      // 💡 ไม่ต้องใส่ Header 'Content-Type': 'application/json' 
      //    เพราะ fetch จะกำหนด 'Content-Type': 'multipart/form-data' ให้เอง
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
    }
    
    const data = await uploadResponse.json();
    return data.url; // คืนค่า URL ที่ถูกต้องจาก Server (เช่น /uploads/abc.jpg)
  };


  // 💡 Submit ฟอร์ม
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);

    let posterUrl: string | null = null;

    try {
      // 1. **อัปโหลดรูปภาพก่อน**
      if (fileToUpload) {
        // 💡 เรียกฟังก์ชันอัปโหลดจริง
        posterUrl = await uploadPoster(fileToUpload); 
        console.log("Poster uploaded successfully:", posterUrl);
      }

      // 2. **สร้างโครงการ** (ส่ง JSON)
      const apiData = {
        title: data.projectName,
        description: data.description,
        goalAmount: data.targetAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        ownerName: "Admin User", 
        contact: "contact@engisut.ac.th",
        posterUrl: posterUrl, // 💡 ใช้ URL จริงที่ได้จากการอัปโหลด
        status: data.status,
      };
      
      const response = await fetch('/api/admin/projects', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData), 
      });

      if (response.ok) {
        alert('โครงการถูกสร้างสำเร็จแล้ว!');
        router.push('/admin/donation'); 
      } else {
        const contentType = response.headers.get('content-type');
        let errorText = `ข้อผิดพลาดสถานะ ${response.status}`;
        
        if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.error || `ข้อผิดพลาดจากเซิร์ฟเวอร์ (สถานะ ${response.status})`;
        } else {
            errorText = `ไม่พบ API Endpoint หรือเกิดข้อผิดพลาดภายใน (404/500)`;
        }
        
        throw new Error(errorText); // โยน Error เพื่อเข้าสู่ Catch Block
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-white p-4 pt-20">
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
              step="any"
              {...register('targetAmount', { 
                required: 'กรุณาระบุเป้าหมาย', 
                min: { value: 0.01, message: 'เป้าหมายต้องมากกว่า 0' },
                valueAsNumber: true 
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เช่น 1000000"
            />
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
          </div>
          
          {/* วันที่เริ่มต้น/สิ้นสุด */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 text-sm font-semibold mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                id="startDate"
                {...register('startDate', { required: 'กรุณาระบุวันที่เริ่มต้น' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-gray-700 text-sm font-semibold mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                id="endDate"
                {...register('endDate', { required: 'กรุณาระบุวันที่สิ้นสุด' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
            </div>
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
              <option value="OPEN">เปิดรับ</option>
              <option value="CLOSED">ปิดรับ</option>
              <option value="COMPLETED">สำเร็จ</option>
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
                className="hidden" 
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