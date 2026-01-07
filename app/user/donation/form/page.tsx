'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSpinner, FaRegSadCry } from 'react-icons/fa';
import { Input } from '@/app/components/ui/Input';
import { CancelButton, PrimaryButton } from '@/app/components/ui/Button';
import { SubmitHandler, useForm } from 'react-hook-form';

// --- Functions & Interfaces ---
const formatThaiDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(date));
};

interface ProjectData {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
}

interface FormData {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  disclosure: 'allow' | 'anonymous';
  amount: number;
  message?: string;
}

// --- Inner Component ---
function DonationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null); 

  const { register, reset, handleSubmit, formState: { errors } } = useForm<FormData>();

  const currentDate = new Date();
  const todayInThai = formatThaiDate(currentDate);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { method: "GET", cache: "no-store" });
        if(res.ok) {
            const userData = await res.json();
            setUserId(userData.id); 
            reset({
              fullName: userData.fullName || '',
              email: userData.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              subdistrict: userData.subdistrict || '',
              district: userData.district || '',
              province: userData.province || '',
              postalCode: userData.postalCode || '',
              disclosure: 'allow',
            });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, [reset]);

  useEffect(() => {
    if (!projectId) {
      setError('ไม่พบ ID โครงการบริจาค');
      setIsLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/donation-project/${projectId}`);
        if (response.status === 404) throw new Error('ไม่พบโครงการบริจาคที่ระบุ');
        if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ');

        const data = await response.json();
        const fetchedProject = data.project as ProjectData;

        if (fetchedProject.status !== 'OPEN') {
          setError('โครงการนี้ปิดรับบริจาคแล้ว');
        }
        setProject(fetchedProject);
      } catch (err) {
        setError((err as Error).message || 'ไม่สามารถโหลดรายละเอียดโครงการได้');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!project?.id || !userId) {
      alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลโครงการหรือผู้ใช้งาน');
      return;
    }

    const payload = {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      subdistrict: data.subdistrict,
      district: data.district,
      province: data.province,
      postalCode: data.postalCode,
      isPublic: data.disclosure === 'allow',
      amount: parseFloat(data.amount.toString()),
      message: data.message || null,
      userId: userId,
      projectId: project.id,
    };

    try {
      const response = await fetch('/api/donation-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        router.push(`/user/payment?paymentId=${result.paymentId}`);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสร้างธุรกรรม');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (apiError) {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-4xl text-[#F26522]" />
        <p className="ml-3 text-lg text-gray-700">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-8 text-center">
        <FaRegSadCry className="text-6xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">เกิดข้อผิดพลาด</h1>
        <p className="text-lg text-gray-600 mt-2">{error || 'ไม่สามารถโหลดข้อมูลโครงการได้'}</p>
        <PrimaryButton className="mt-6" onClick={() => router.push('/user/donation')}>
          กลับไปยังหน้ารายการ
        </PrimaryButton>
      </div>
    );
  }

  const isProjectClosed = project.status !== 'OPEN';

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl p-4 md:p-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{project.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
          <div className="md:col-span-5 space-y-6">
            <Image
              src={project.posterUrl || "/donation_poster/default.png"}
              alt="โปสเตอร์โครงการ"
              width={700} height={900}
              className="rounded-lg shadow-lg object-cover w-full"
            />
            <div className="text-gray-700 space-y-3">
              <p className="font-medium">{project.description}</p>
              <div className="text-sm">
                <p>เป้าหมาย: ฿{project.goalAmount.toLocaleString()}</p>
                <p>สถานะ: <span className={isProjectClosed ? 'text-red-500' : 'text-green-600'}>{project.status === 'OPEN' ? 'เปิดรับ' : 'ปิดรับแล้ว'}</span></p>
                <p>วันที่เริ่ม: {formatThaiDate(project.startDate)}</p>
                <p>วันสิ้นสุด: {formatThaiDate(project.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">ข้อมูลผู้บริจาค</h2>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm text-gray-500 mb-2">ชื่อ-สกุล <span className="text-red-500">*</span></label>
                <Input type='text' {...register('fullName', { required: 'กรุณาระบุชื่อผู้บริจาค' })} />
                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">อีเมล <span className="text-red-500">*</span></label>
                  <Input type='email' {...register('email', { required: 'กรุณาระบุ email' })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <Input type='text' {...register('phone', { required: 'กรุณาระบุเบอร์โทรศัพท์' })} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">ที่อยู่ <span className="text-red-500">*</span></label>
                <Input {...register('address', { required: 'กรุณาระบุที่อยู่' })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="ตำบล" {...register('subdistrict', { required: true })} />
                <Input placeholder="อำเภอ" {...register('district', { required: true })} />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">จำนวนเงินที่บริจาค (บาท) <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" {...register('amount', { required: true, min: 1 })} />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <CancelButton type="button" onClick={() => router.back()}>ยกเลิก</CancelButton>
                <PrimaryButton type="submit" disabled={isProjectClosed}>
                  {isProjectClosed ? 'โครงการปิดรับบริจาค' : 'ถัดไป'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Export ---
export default function CombinedDonationFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-4xl text-[#F26522]" />
      </div>
    }>
      <DonationForm />
    </Suspense>
  );
}