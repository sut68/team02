'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
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

// 💡 1. ปรับ FormData ให้ตรงกับ Model BudgetDonation
interface FormData {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;

  disclosure: 'allow' | 'anonymous'; // ตัวแปรหน้าบ้าน (แปลงเป็น isPublic ทีหลัง)
  amount: number;
  message?: string;
}

export default function CombinedDonationFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 💡 สมมติ User ID (ในงานจริงควรมาจาก Session)
  const [userId, setUserId] = useState<number | null>(null);

  const { register, reset, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

  const currentDate = new Date();
  const todayInThai = formatThaiDate(currentDate);

  // --- ดึงข้อมูล User มา Auto-fill ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { method: "GET", cache: "no-store" });
        if (res.ok) {
          const userData = await res.json();
          // เก็บ userId ไว้ใช้ตอน submit
          setUserId(userData.id);

          // Auto-fill ข้อมูล
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

  // --- ดึงข้อมูลโครงการ ---
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
        console.error('Fetch error:', err);
        setError((err as Error).message || 'ไม่สามารถโหลดรายละเอียดโครงการได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);


  // 💡 2. Submit Handler ปรับให้ตรง Model
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!project?.id || !userId) {
      alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลโครงการหรือผู้ใช้งาน');
      return;
    }

    // สร้าง Payload ให้ตรงกับ Model BudgetDonation
    const payload = {
      // Scalar fields
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      subdistrict: data.subdistrict,
      district: data.district,
      province: data.province,
      postalCode: data.postalCode,

      // Logic fields
      isPublic: data.disclosure === 'allow',
      amount: parseFloat(data.amount.toString()),
      message: data.message || null,

      // Relations
      userId: userId, // ใส่ User ID ที่ดึงมา
      projectId: project.id,
    };

    console.log('Submitting Payload:', payload);

    try {
      const response = await fetch('/api/budget-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // รับค่า paymentId ที่เราเพิ่งเพิ่มเข้าไป
        const paymentId = result.paymentId;

        // ส่งไปหน้า Payment
        router.push(`/user/payment?paymentId=${paymentId}`);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสร้างธุรกรรม');
      }
    } catch (apiError) {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  // --- Render ---
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {project.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
          {/* Details Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="w-full">
              <Image
                src={project.posterUrl || "/donation_poster/default.png"}
                alt="โปสเตอร์โครงการ"
                width={700}
                height={900}
                className="rounded-lg shadow-lg object-cover w-full"
              />
            </div>
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

          {/* Form Column */}
          <div className="md:col-span-5">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">ข้อมูลผู้บริจาค</h2>

            {error && <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50">{error}</div>}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

              {/* FullName */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">ชื่อ-สกุล (Fullname) <span className="text-red-500">*</span></label>
                <Input type='text' id="fullName" placeholder="ชื่อ นามสกุล"
                  {...register('fullName', { required: 'กรุณาระบุชื่อผู้บริจาค' })}
                />
                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">อีเมล (Email) <span className="text-red-500">*</span></label>
                <Input type='email' id="email" placeholder="email@example.com"
                  {...register('email', { required: 'กรุณาระบุ email', pattern: { value: /^\S+@\S+$/i, message: "รูปแบบอีเมลไม่ถูกต้อง" } })}
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <Input type='text' id="phone" placeholder="08x xxxx xxxx"
                  {...register('phone', { required: 'กรุณาระบุ เบอร์โทรศัพท์' })}
                />
                {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
              </div>

              {/* Address Fields (ตาม Model) */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">ที่อยู่ (เลขที่, หมู่, ซอย, ถนน) <span className="text-red-500">*</span></label>
                <Input id="address" placeholder="ที่อยู่"
                  {...register('address', { required: 'กรุณาระบุ ที่อยู่' })}
                />
                {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">ตำบล/แขวง <span className="text-red-500">*</span></label>
                  <Input type="text" id="subdistrict" placeholder="ตำบล"
                    {...register('subdistrict', { required: 'กรุณาระบุ ตำบล' })}
                  />
                  {errors.subdistrict && <span className="text-xs text-red-500">{errors.subdistrict.message}</span>}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">อำเภอ/เขต <span className="text-red-500">*</span></label>
                  <Input type="text" id="district" placeholder="อำเภอ"
                    {...register('district', { required: 'กรุณาระบุ อำเภอ' })}
                  />
                  {errors.district && <span className="text-xs text-red-500">{errors.district.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">จังหวัด <span className="text-red-500">*</span></label>
                  <Input type="text" id="province" placeholder="จังหวัด"
                    {...register('province', { required: 'กรุณาระบุ จังหวัด' })}
                  />
                  {errors.province && <span className="text-xs text-red-500">{errors.province.message}</span>}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                  <Input type="text" id="postalCode" placeholder="รหัสไปรษณีย์"
                    {...register('postalCode', { required: 'กรุณาระบุ รหัสไปรษณีย์' })}
                  />
                  {errors.postalCode && <span className="text-xs text-red-500">{errors.postalCode.message}</span>}
                </div>
              </div>

              {/* Disclosure (isPublic) */}
              <div className="pt-4 flex items-start space-x-3 text-sm">
                <p className="text-gray-700">ความประสงค์การเปิดเผยข้อมูล</p>
                <div className="flex space-x-6">
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input type="radio" value="allow" {...register('disclosure')} className="w-4 h-4 mr-2 text-orange-600 focus:ring-orange-500" />
                    เปิดเผยชื่อผู้บริจาค
                  </label>
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input type="radio" value="anonymous" {...register('disclosure')} className="w-4 h-4 mr-2 text-orange-600 focus:ring-orange-500" />
                    ไม่ประสงค์เปิดเผยชื่อ
                  </label>
                </div>
              </div>

              {/* Donation Data */}
              <h2 className="text-2xl font-medium text-gray-800 pt-6 border-t border-gray-200 mb-6">ข้อมูลบริจาค</h2>

              <div>
                <label className="block text-sm text-gray-500 mb-2">ชื่อโครงการ</label>
                <Input name="projectName" defaultValue={project.title} disabled />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">จำนวนเงินที่บริจาค (บาท) <span className="text-red-500">*</span></label>
                <Input type="number" id="amount" step="0.01" min="1"
                  {...register('amount', { required: 'กรุณาระบุ จำนวนเงิน', min: { value: 1, message: "จำนวนเงินต้องมากกว่า 0" } })}
                />
                {errors.amount && <span className="text-xs text-red-500">{errors.amount.message}</span>}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">ข้อความที่ท่านฝากถึง (Optional)</label>
                <textarea
                  rows={3}
                  id="message"
                  placeholder="ข้อความให้กำลังใจ..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none"
                  {...register('message')}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">วันที่ทำรายการ</label>
                <Input name="donationDate" defaultValue={todayInThai} disabled />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-gray-200">
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