'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form'; 
import { Card } from './../../../components/ui/Card'; 
import { PrimaryButton, CancelButton } from './../../../components/ui/Button'; 
import { UploadCloud } from 'lucide-react'; 

interface FormData {
  projectName: string;
  projectType: string;
  targetAmount: number;
  status: string; 
  description: string;
  startDate: string;
  endDate: string;
  posterImage: FileList | null;
  ownerName: string; 
  contact: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      status: "OPEN",
      projectType: "",
      ownerName: "", 
      contact: ""    
    }
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const watchedImage = watch("posterImage");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    if (watchedImage && watchedImage.length > 0) {
      const file = watchedImage[0];
      setFileToUpload(file);
      objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null);
    }
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [watchedImage]);

  const uploadPoster = async (file: File): Promise<string> => {
    const uploadFormData = new window.FormData();
    uploadFormData.append('file', file);
    
    const uploadResponse = await fetch('/api/donation-project/upload-poster', {
      method: 'POST',
      body: uploadFormData, 
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
    }
    
    const data = await uploadResponse.json();
    return data.url; 
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    let posterUrl: string | null = null;

    try {
      if (fileToUpload) {
        posterUrl = await uploadPoster(fileToUpload); 
      }

      const apiData = {
        title: data.projectName,
        description: data.description,
        goalAmount: data.targetAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        ownerName: data.ownerName, 
        contact: data.contact,   
        posterUrl: posterUrl, 
        status: data.status,
        projectType: data.projectType,
      };
      
       const response = await fetch('/api/donation-project', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData), 
      });

      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        alert('โครงการถูกสร้างสำเร็จแล้ว!');
        router.push('/admin/donation'); 
      } else {
        const contentType = response.headers.get('content-type');
        let errorText = `ข้อผิดพลาดสถานะ ${response.status}`;
        if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.error || `ข้อผิดพลาดจากเซิร์ฟเวอร์`;
        }
        throw new Error(errorText); 
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          สร้างโครงการใหม่
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="projectName" className="block text-gray-700 text-sm font-semibold mb-2">
              ชื่อโครงการ
            </label>
            <input
              type="text"
              id="projectName"
              {...register('projectName', { required: 'กรุณาระบุชื่อโครงการ' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เช่น ทุนเรียนดี ชาววิศวะ"
            />
            {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName.message}</p>}
          </div>

          <div>
            <label htmlFor="projectType" className="block text-gray-700 text-sm font-semibold mb-2">
              ประเภททุน (Project Type)
            </label>
            <select
              id="projectType"
              {...register('projectType', { required: 'กรุณาเลือกประเภททุน' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
            >
              <option value="">-- กรุณาเลือก --</option>
              <option value="CENTRAL">กองทุนกลาง (Central Fund)</option>
              <option value="SCHOLARSHIP">ทุนการศึกษา (Scholarship)</option>
              <option value="ACTIVITY">ทุนสนับสนุนกิจกรรม (Activity)</option>
              <option value="RESEARCH">ทุนวิจัย (Research)</option>
              <option value="BUILDING">ทุนสร้างตึก/ซ่อมบำรุง (Building)</option>
              <option value="EMERGENCY">ทุนช่วยเหลือฉุกเฉิน (Emergency)</option>
              <option value="OTHER">อื่นๆ (Other)</option>
            </select>
            {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ownerName" className="block text-gray-700 text-sm font-semibold mb-2">
                ชื่อผู้รับผิดชอบโครงการ
              </label>
              <input
                type="text"
                id="ownerName"
                {...register('ownerName', { required: 'กรุณาระบุชื่อผู้รับผิดชอบ' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
              />
              {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName.message}</p>}
            </div>
            <div>
              <label htmlFor="contact" className="block text-gray-700 text-sm font-semibold mb-2">
                ข้อมูลติดต่อ (เบอร์/Email)
              </label>
              <input
                type="text"
                id="contact"
                {...register('contact', { required: 'กรุณาระบุข้อมูลติดต่อ' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                placeholder="เช่น 044-222-333"
              />
              {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-gray-700 text-sm font-semibold mb-2">
              เป้าหมาย (จำนวนเงิน)
            </label>
            <input
              type="number"
              id="targetAmount"
              step="any"
              {...register('targetAmount', { 
                min: { value: 0.01, message: 'เป้าหมายต้องมากกว่า 0' },
                valueAsNumber: true 
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เช่น 1000000"
            />
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
          </div>

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
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
              รายละเอียดโครงการ
            </label>
            <textarea
              id="description"
              {...register('description', { required: 'กรุณาระบุรายละเอียดโครงการ' })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="รายละเอียดโครงการ..."
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

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
                      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
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