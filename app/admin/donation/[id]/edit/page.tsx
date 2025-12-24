'use client';

import { useState, useEffect, useCallback,  } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { UploadCloud, Trash2 } from 'lucide-react';
import { Card } from '@/app/components/ui/Card';
import { PrimaryButton, CancelButton } from '@/app/components/ui/Button';

// --------------------------------------------------------------------------
//  Interfaces/Types
// --------------------------------------------------------------------------
interface ProjectData {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  posterUrl: string | null;
  ownerName: string; 
  isCentralFund: boolean;
}

interface EditFormData extends Omit<ProjectData, 'id' | 'goalAmount' | 'posterUrl' | 'ownerName'> {
  id?: number;
  goalAmount: number;
  posterImage: FileList | null; // สำหรับรูปภาพใหม่
  isCentralFund: boolean;
}


// --------------------------------------------------------------------------
// 💡 Component หลัก: หน้าแก้ไขโครงการ
// --------------------------------------------------------------------------
export default function EditProjectPage({ params }: { params: any }) { 
  const router = useRouter();

  const [projectId, setProjectId] = useState<number | null>(null);

  const [initialData, setInitialData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<EditFormData>();
  const [currentPosterUrl, setCurrentPosterUrl] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const watchedImage = watch("posterImage");

  // เมื่อไฟล์รูปภาพถูกเลือก
  useEffect(() => {
    let objectUrl: string | null = null;

    if (watchedImage && watchedImage.length > 0) {
      const file = watchedImage[0];

      objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchedImage,]);

  // ดึงข้อมูลโครงการเดิมมาแสดง
  const fetchAndSetData = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    async function fetchProjectData() {
      try {
        const res = await fetch(`/api/donation-project/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();
        const p = data.project;

        setInitialData(p);
        setCurrentPosterUrl(p.posterUrl || null);

        const formatISODate = (iso: string) => iso ? new Date(iso).toISOString().split('T')[0] : '';

        reset({
          title: p.title,
          description: p.description,
          goalAmount: p.goalAmount,
          startDate: formatISODate(p.startDate),
          endDate: formatISODate(p.endDate),
          status: p.status,
          isCentralFund: p.isCentralFund || false,
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjectData();

  }, [reset]);

  useEffect(() => {
    Promise.resolve(params)
      .then((resolved: any) => {
        const routeIdString = typeof resolved?.id === 'string' ? resolved.id : String(resolved?.id || '');
        const id = parseInt(routeIdString, 10);

        if (isNaN(id)) {
          setError('Project ID ไม่ถูกต้อง');
          setLoading(false);
          return;
        }

        setProjectId(id);
        fetchAndSetData(id);
      })
      .catch((err: any) => {
        setError(err?.message || 'ไม่สามารถอ่าน params ได้');
        setLoading(false);
      });
  }, [params, fetchAndSetData]);

  const uploadPoster = async (file: File): Promise<string> => {
    const uploadFormData = new window.FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch('/api/donation-project/upload-poster', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const contentType = uploadResponse.headers.get('content-type');
      let errorMsg = `HTTP Error: ${uploadResponse.status}`;

      if (contentType && contentType.includes('application/json')) {
        const errorData = await uploadResponse.json();
        errorMsg = errorData.message || errorMsg;
      }

      throw new Error(errorMsg);
    }
    const data = await uploadResponse.json();

    return data.url; 
  };

  const onSubmit: SubmitHandler<EditFormData> = async (data) => {
    if (!projectId) return;
    setIsSubmitting(true);
    setError(null);

    let updatedPosterUrl = currentPosterUrl;

    try {
      if (data.posterImage && data.posterImage.length > 0) {
        updatedPosterUrl = await uploadPoster(data.posterImage[0]);
        console.log("updatedPosterUrl", updatedPosterUrl);
      }

      const apiData = {
        title: data.title,
        description: data.description,
        goalAmount: data.goalAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        posterUrl: updatedPosterUrl,
        // ส่งค่า ownerName/contact ที่มีอยู่จริง แทนการใช้ String constructor
        ownerName: initialData?.ownerName ?? '',
        isCentralFund: data.isCentralFund,
      };

      const response = await fetch(`/api/donation-project/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        alert('การแก้ไขโครงการสำเร็จแล้ว!');
        router.push('/admin/donation/projects');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `ไม่สามารถแก้ไขโครงการได้`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/donation-project/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('โครงการถูกลบเรียบร้อยแล้ว');
        router.push('/admin/donation/projects');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถลบโครงการได้');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Render Loading/Error States
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">กำลังโหลดข้อมูลโครงการ...</p>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  function resetField(arg0: string, arg1: { defaultValue: null; }) {
    throw new Error('Function not implemented.');
  }

  // ----------------------------------------------------
  // Render Form
  // ----------------------------------------------------
  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-4 pt-8">
      <Card className="w-full max-w-4xl p-8 shadow-lg rounded-xl bg-white">

        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            แก้ไขโครงการ: {initialData?.title}
          </h1>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center text-red-600 hover:text-red-700 transition space-x-2 disabled:opacity-50"
            title="ลบโครงการ"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">ลบโครงการ</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ชื่อโครงการ / เป้าหมาย (Grid) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">ชื่อโครงการ</label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'กรุณาระบุชื่อโครงการ' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                placeholder="ชื่อโครงการ"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="goalAmount" className="block text-gray-700 text-sm font-semibold mb-2">เป้าหมาย (฿)</label>
              <input
                type="number"
                id="goalAmount"
                step="any"
                {...register('goalAmount', {
                  required: 'กรุณาระบุเป้าหมาย',
                  min: { value: 0.01, message: 'เป้าหมายต้องมากกว่า 0' },
                  valueAsNumber: true
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                placeholder="จำนวนเงินเป้าหมาย"
              />
              {errors.goalAmount && <p className="text-red-500 text-xs mt-1">{errors.goalAmount.message}</p>}
            </div>
          </div>

          {/* วันที่เริ่มต้น/สิ้นสุด */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 text-sm font-semibold mb-2">วันที่เริ่มต้น</label>
              <input
                type="date"
                id="startDate"
                {...register('startDate', { required: 'กรุณาระบุวันที่เริ่มต้น' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none bg-white"
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-gray-700 text-sm font-semibold mb-2">วันที่สิ้นสุด</label>
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
            <label htmlFor="status" className="block text-gray-700 text-sm font-semibold mb-2">สถานะ</label>
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

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="isCentralFund"
              {...register('isCentralFund')}
              className="w-5 h-5 text-[#F26522] border-gray-300 rounded focus:ring-[#F26522] accent-[#F26522] cursor-pointer"
            />
            <label htmlFor="isCentralFund" className="text-gray-700 text-sm font-semibold cursor-pointer select-none">
              ตั้งเป็นกองทุนกลาง (Central Fund)
            </label>
          </div>

          {/* รายละเอียดโครงการ */}
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">รายละเอียดโครงการ</label>
            <textarea
              id="description"
              {...register('description', { required: 'กรุณาระบุรายละเอียดโครงการ' })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
              placeholder="เพื่อมอบทุนให้นักศึกษาสาขา ..."
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* อัปโหลดโปสเตอร์ */}
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
            <h3 className="text-base font-semibold mb-3 text-gray-800">โปสเตอร์โครงการ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

              {/* 1. รูปภาพปัจจุบัน / Preview */}
              <div className="sm:col-span-1">
                {currentPosterUrl || imagePreview ? (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden shadow-sm">
                    <Image
                      key={imagePreview || currentPosterUrl || 'default'}
                      src={imagePreview || currentPosterUrl || '#'}
                      alt="Poster Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: "cover" }}
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 border border-dashed rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    ไม่มีโปสเตอร์
                  </div>
                )}
                {/*  แสดง URL เดิมที่ใช้อยู่ */}
                {currentPosterUrl && <p className="text-xs text-gray-500 mt-2 truncate">URL: {currentPosterUrl}</p>}
              </div>

              {/* 2. ปุ่มอัปโหลด */}
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-700 mb-2">อัปโหลดรูปภาพใหม่เพื่อแทนที่</p>
                <div
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#F26522] transition-colors duration-200"
                  onClick={() => document.getElementById('posterImage')?.click()}
                >
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">คลิกเพื่ออัปโหลด (JPEG, PNG, GIF)</p>

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

                {/* ปุ่มลบรูปภาพ (ถ้ามีรูปภาพอยู่) */}
                {currentPosterUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPosterUrl(null);
                    }}
                    className="mt-2 text-red-500 text-xs hover:underline"
                  >
                    ลบโปสเตอร์ปัจจุบัน
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* 5. ปุ่ม Submit / Cancel */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end space-x-4 mt-8">
            <CancelButton type="button" onClick={() => router.back()}>
              ยกเลิก
            </CancelButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}