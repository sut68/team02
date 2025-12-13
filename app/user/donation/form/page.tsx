'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSpinner, FaRegSadCry } from 'react-icons/fa';
import { Input } from '@/app/components/ui/Input';
import { CancelButton, PrimaryButton } from '@/app/components/ui/Button';
import { SubmitHandler, useForm } from 'react-hook-form';

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
// สำหรับ Form Input โดยเฉพาะ
interface FormData {
  fullName: string;
  email: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  // donationDate: string; // วันที่บริจาค (สร้างอัตโนมัติ) 
  disclosure: 'allow' | 'anonymous';
  amount: number;
  message: string;
  projectId: number; // hidden field
}

// ----------------------------------------------------
// 💡 Component หน้ารวมรายละเอียดและฟอร์ม
// ----------------------------------------------------
export default function CombinedDonationFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUserLoading, setIsUserLoading] = useState(true);
  const { register, reset, handleSubmit} = useForm<FormData>();


  const currentDate = new Date();
  const todayInThai = formatThaiDate(currentDate);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsUserLoading(true);
        const res = await fetch('/api/auth/me', {
          method: "GET",
          cache: "no-store",
        });
        const data = await res.json();
        const userData = data as FormData;
        console.log("Fetched User Data:", userData);

        reset({
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          subdistrict: userData.subdistrict,
          district: userData.district,
          province: userData.province,
          postalCode: userData.postalCode,
          disclosure: 'allow',
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsUserLoading(false);
      }
    };

    fetchUser();
  }, [reset]);

  // --- ดึงข้อมูลโครงการจาก API ---
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

        if (response.status === 404) {
          throw new Error('ไม่พบโครงการบริจาคที่ระบุ');
        }
        if (!response.ok) {
          throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ');
        }

        const data = await response.json();
        const fetchedProject = data.project as ProjectData;
        console.log('Fetched Project:', fetchedProject);

        if (fetchedProject.status !== 'OPEN') {
          setError('โครงการนี้ปิดรับบริจาคแล้ว');
        }
        setProject(fetchedProject);
      } catch (err) {
        console.error('Fetch error:', err);
        setError((err as Error).message || 'ไม่สามารถโหลดรายละเอียดโครงการได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // setLoading(true);

    // 1. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!data.fullName || !data.email || !data.phone || !data.amount || !project?.id) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // 2. สร้าง Payload
    const payload = {
      ...data,
      projectId: project.id,
      isPublic: data.disclosure === 'allow',
      amount: Number(data.amount)
    };
    console.log('Submitting Donation Transaction with payload:', payload);

    // 3. API Call (ตัวอย่าง)
    try {
      const response = await fetch('/api/donation-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // สำเร็จ: ไปยังหน้า Payment (ใช้ transactionId ที่ได้มา)
        alert('สร้างรายการธุรกรรมสำเร็จ! โปรดทำการชำระเงิน');
        console.log('Transaction Created:', result);
        router.push(`/user/payment?transactionId=${result.transaction.id}`);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสร้างธุรกรรม');
      }
    } catch (apiError) {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อสร้างธุรกรรมได้');
    }
  };


  // --- Loading/Error State Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-4xl text-[#F26522]" />
        <p className="ml-3 text-lg text-gray-700">กำลังโหลดข้อมูลโครงการ...</p>
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

  const { title, goalAmount, currentAmount, posterUrl, startDate, endDate, status } = project;
  const progressPercent = (currentAmount / goalAmount) * 100;
  const isProjectClosed = status !== 'OPEN';

  return (
    <div className="bg-white min-h-screen">
      {/* Container หลัก */}
      <div className="container mx-auto max-w-7xl p-4 md:p-8 mt-4">

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {title}
        </h1>

        {/* 1. โครงสร้าง Grid หลัก (3 คอลัมน์ บน Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">

          {/* =========== COLUMN 1: รายละเอียดโครงการ (1/3) =========== */}
          <div className="md:col-span-5 space-y-6">

            {/* 1.1 รูปภาพ Poster */}
            <div className="w-full">
              <Image
                src={posterUrl || "/donation_poster/default.png"}
                alt="โปสเตอร์โครงการ"
                width={700}
                height={900}
                className="rounded-lg shadow-lg object-cover w-full"
              />
            </div>

            {/* 1.2 รายละเอียดสรุป */}
            <div className="text-gray-700 space-y-3">
              <p className="font-medium">
                {project.description}
              </p>
              <div className="text-sm">
                <p>เป้าหมาย: ฿{goalAmount.toLocaleString()}</p>
                <p className="text-[#F26522] font-semibold">บริจาคแล้ว: ฿{currentAmount.toLocaleString()}</p>
                <p>สถานะ: <span className={isProjectClosed ? 'text-red-500' : 'text-green-600'}>{status === 'OPEN' ? 'เปิดรับ' : 'ปิดรับแล้ว'}</span></p>
                <p>วันที่เริ่ม: {formatThaiDate(startDate)}</p>
                <p>วันสิ้นสุด: {formatThaiDate(endDate)}</p>
              </div>
            </div>
          </div>

          {/* =========== COLUMN 2: ฟอร์มข้อมูล (2/3) =========== */}
          <div className="md:col-span-5">

            {/* 🔶 3) หัวข้อฟอร์ม */}
            <h2 className="text-2xl font-medium text-gray-800 mb-6">
              ข้อมูลผู้บริจาค
            </h2>

            {/* แสดง Error หากมี */}
            {error && <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50">{error}</div>}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* --- ข้อมูลผู้บริจาค--- */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">ชื่อ-สกุล (Fullname) <span className="text-red-500">*</span></label>
                <Input type='text' id="fullName" placeholder="ชื่อผู้บริจาค"
                  {...register('fullName', { required: 'กรุณาระบุชื่อผู้บริจาค' })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">อีเมล (Email) <span className="text-red-500">*</span></label>
                <Input type='text' id="email" placeholder="email@example.com"
                  {...register('email', { required: 'กรุณาระบุ email' })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <Input type='text' id="phone" placeholder="08x xxxx xxxx"
                  {...register('phone', { required: 'กรุณาระบุ เบอร์โทรศัพท์' })}
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">ที่อยู่ <span className="text-red-500">*</span></label>
                <Input id="address"
                  placeholder="ที่อยู่"
                  {...register('address', { required: 'กรุณาระบุ ที่อยู่' })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">ตำบล <span className="text-red-500">*</span>
                  </label>
                  <Input type="text" id="subdistrict" placeholder="สุรนารี"
                    {...register('subdistrict', { required: 'กรุณาระบุ ตำบล' })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">อำเภอ <span className="text-red-500">*</span></label>
                  <Input type="text" id="district" placeholder="เมืองนครราชสีมา"
                    {...register('district', { required: 'กรุณาระบุ อำเภอ' })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">จังหวัด <span className="text-red-500">*</span></label>
                  <Input type="text" id="province" placeholder="นครราชสีมา"
                    {...register('province', { required: 'กรุณาระบุ จังหวัด' },)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                  <Input type="text" id="postalCode" placeholder="30000"
                    {...register('postalCode', { required: 'กรุณาระบุ รหัสไปรษณีย์' })}
                  />
                </div>
              </div>


              {/* --- การอนุญาตเปิดเผยข้อมูล --- */}
              <div className="pt-4 flex items-start space-x-3 text-sm">
                <p className="text-gray-700">ความประสงค์การเปิดเผยข้อมูล</p>
                <div className="flex space-x-6">
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input
                      type="radio"
                      value="allow"
                      {...register('disclosure')} 
                      className="w-4 h-4 mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    เปิดเผยชื่อผู้บริจาค
                  </label>
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input
                      type="radio"
                      value="anonymous"
                      {...register('disclosure')} 
                      className="w-4 h-4 mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    ไม่ประสงค์เปิดเผยชื่อ (นามแฝง/ไม่ระบุ)
                  </label>
                </div>
              </div>

              {/* --- ข้อมูลบริจาค --- */}
              <h2 className="text-2xl font-medium text-gray-800 pt-6 border-t border-gray-200 mb-6">
                ข้อมูลบริจาค
              </h2>

              <div>
                <label className="block text-sm text-gray-500 mb-2">ชื่อโครงการ</label>
                <Input name="projectName" defaultValue={title} disabled />
                {/* Hidden Input สำหรับ Project ID */}
                <input
                  type="hidden"
                  name="projectId"
                  value={projectId || ''} />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">จำนวนเงินที่บริจาค <span className="text-red-500">*</span></label>
                <Input type="number" id="amount"
                   {...register('amount', { required: 'กรุณาระบุ จำนวนเงินที่บริจาค' },)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">ข้อความที่ท่านฝากถึง</label>
                <textarea
                  rows={3}
                  id="message"
                  placeholder="ของส่งกำลังใจให้เด็กๆ ทุกคนเลยนะครั...บบ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none"
                 {...register('message')}
                ></textarea>
              </div>

              {/* --- วันที่ --- */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">วันที่บริจาค</label>
                <Input name="donationDate" defaultValue={todayInThai} disabled />
              </div>

              {/* --- ปุ่ม Navigation --- */}
              <div className="flex justify-end space-x-4 pt-6 border-gray-200">
                <CancelButton type="button" onClick={() => router.back()}>
                  ยกเลิก
                </CancelButton>

                <PrimaryButton type="submit" disabled={isProjectClosed}>
                  {isProjectClosed ? 'โครงการปิดรับบริจาค' : 'ถัดไป'}
                </PrimaryButton>
              </div>

            </form>
          </div>
        </div>
      </div >
    </div >
  );
}