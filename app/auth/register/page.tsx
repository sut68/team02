'use client';

import React, { useState, useCallback } from 'react';
import { GraduationCap, Book, Upload, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserType = 'student' | 'alumni' | null;

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  studentCode: string;
  major: string;
  gradYear: string;
  transcript: File | null;
};

const initialFormData: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  addressLine: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  phone: '',
  studentCode: '',
  major: '',
  gradYear: '',
  transcript: null,
};

const stepLabels = ['ข้อมูลส่วนตัว', 'ประวัติการศึกษา', 'การยืนยันตัว'];

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      setFormData((prev) => ({ ...prev, [field]: file as any }));
    },
    []
  );

  const validateStep = (s: number) => {
    setError(null);
    if (s === 1) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.addressLine ||
        !formData.subdistrict ||
        !formData.district ||
        !formData.province ||
        !formData.postalCode ||
        !formData.phone
      ) {
        setError('กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
        return false;
      }
    }

    if (s === 2) {
      if (!formData.studentCode || !formData.major) {
        setError('กรุณากรอกประวัติการศึกษาให้ครบถ้วน');
        return false;
      }
      if (userType === 'alumni' && !formData.gradYear) {
        setError('กรุณาระบุปีที่จบการศึกษา');
        return false;
      }
      // Note: transcript is optional for now (file upload can be implemented later)
    }

    return true;
  };

  const handleRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          phone: formData.phone,
          address: formData.addressLine,
          subdistrict: formData.subdistrict,
          district: formData.district,
          province: formData.province,
          postalCode: formData.postalCode,
          studentCode: formData.studentCode || undefined,
          major: formData.major || undefined,
          gradYear: formData.gradYear || undefined,
          userType: userType || 'student',
          transcriptUrl: formData.transcript?.name || undefined, // TODO: implement file upload
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }

      setRegistrationSuccess(true);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    if (!validateStep(step)) return;
    
    if (step === 2) {
      // After step 2 validation passes, submit the form
      handleRegister();
    } else {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const onBack = () => {
    if (step === 1) {
      setUserType(null);
      setFormData(initialFormData);
      setError(null);
    } else {
      setStep((s) => Math.max(1, s - 1));
      setError(null);
    }
  };

  const RegisterSelect = () => (
    <div className="min-h-screen py-6 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-light text-blue-600 mb-3">
            กรุณาเลือกประเภทของคุณ
          </h2>
          <p className="text-gray-500 text-sm">
            เพื่อเริ่มต้นการลงทะเบียนในระบบศิษย์เก่าวิศวกรรมศาสตร์
          </p>
        </div>

        <div className="grid grid-cols-2 gap-16 max-w-5xl mx-auto">
          <button
            onClick={() => {
              setUserType('alumni');
              setStep(1);
            }}
            className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-20 hover:border-orange-400 transition group"
          >
            <div className="flex justify-center mb-8">
              <GraduationCap className="w-40 h-40 text-orange-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-normal text-gray-800">ศิษย์เก่า</h3>
          </button>

          <button
            onClick={() => {
              setUserType('student');
              setStep(1);
            }}
            className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-20 hover:border-orange-400 transition group"
          >
            <div className="flex justify-center mb-8">
              <Book className="w-40 h-40 text-orange-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-normal text-gray-800">ศิษย์ปัจจุบัน</h3>
          </button>
        </div>
      </div>
    </div>
  );

  const CommonStep1 = (
    <div className="grid grid-cols-2 gap-16">
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-gray-800 mb-8">ข้อมูลส่วนตัว</h2>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="ธนวา กุวัสต"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="thanwa.eng@sut.ac.th"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="ต้องมีอย่างน้อย 8 ตัวอักษร (เช่น Thanwa2025)"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-gray-800 mb-8 invisible">ที่อยู่</h2>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ที่อยู่ <span className="text-red-500">*</span>
          </label>
          <input
            name="addressLine"
            value={formData.addressLine}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="199 หมู่ 9 ถนนมิตรภาพ"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              ตำบล <span className="text-red-500">*</span>
            </label>
            <input
              name="subdistrict"
              value={formData.subdistrict}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
              placeholder="สุรนารี"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              อำเภอ <span className="text-red-500">*</span>
            </label>
            <input
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
              placeholder="เมืองนครราชสีมา"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              จังหวัด <span className="text-red-500">*</span>
            </label>
            <input
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
              placeholder="นครราชสีมา"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              รหัสไปรษณีย์ <span className="text-red-500">*</span>
            </label>
            <input
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
              placeholder="30000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="086-245-7930"
          />
        </div>
      </div>
    </div>
  );

  const StudentStep2 = () => (
    <div className="grid grid-cols-2 gap-16">
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-gray-800 mb-8">ประวัติการศึกษา</h2>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสนักศึกษา <span className="text-red-500">*</span>
          </label>
          <input
            name="studentCode"
            value={formData.studentCode}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="B6610456"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            สาขาวิชา <span className="text-red-500">*</span>
          </label>
          <input
            name="major"
            value={formData.major}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="วิศวกรรมคอมพิวเตอร์"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <h2 className="text-2xl font-medium text-gray-800 mb-8 invisible">ข้อมูลเพิ่มเติม</h2>

        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">
            ไฟล์หลักฐานการศึกษา <span className="text-red-500">*</span>
          </label>
          <label className="w-full h-[calc(100%-2rem)] px-4 py-12 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange-400 transition">
            <Upload className="w-10 h-10 mb-3 text-gray-300" strokeWidth={1.5} />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'transcript')}
              className="hidden"
            />
            <span className="text-sm text-gray-400">อัปโหลดไฟล์</span>
            <span className="text-xs text-gray-400 mt-1">
              Transcript หรือเอกสารรับรองสถานภาพการเรียน
            </span>
            {formData.transcript && (
              <span className="text-xs mt-2 text-gray-600">{formData.transcript.name}</span>
            )}
          </label>
        </div>
      </div>
    </div>
  );

  const AlumniStep2 = () => (
    <div className="grid grid-cols-2 gap-16">
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-gray-800 mb-8">ประวัติการศึกษา</h2>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสนักศึกษา <span className="text-red-500">*</span>
          </label>
          <input
            name="studentCode"
            value={formData.studentCode}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="B6610456"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ปีที่จบการศึกษา <span className="text-red-500">*</span>
          </label>
          <input
            name="gradYear"
            value={formData.gradYear}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="2568"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">
            สาขาวิชา <span className="text-red-500">*</span>
          </label>
          <input
            name="major"
            value={formData.major}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-400 placeholder-gray-400"
            placeholder="วิศวกรรมคอมพิวเตอร์"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <h2 className="text-2xl font-medium text-gray-800 mb-8 invisible">ข้อมูลเพิ่มเติม</h2>

        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">
            ไฟล์หลักฐานการศึกษา <span className="text-red-500">*</span>
          </label>
          <label className="w-full h-[calc(100%-2rem)] px-4 py-12 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange-400 transition">
            <Upload className="w-10 h-10 mb-3 text-gray-300" strokeWidth={1.5} />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'transcript')}
              className="hidden"
            />
            <span className="text-sm text-gray-400">อัปโหลดไฟล์</span>
            <span className="text-xs text-gray-400 mt-1">
              Transcript หรือเอกสารรับรองสถานภาพการเรียน
            </span>
            {formData.transcript && (
              <span className="text-xs mt-2 text-gray-600">{formData.transcript.name}</span>
            )}
          </label>
        </div>
      </div>
    </div>
  );

  const SuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <UserCheck className="w-28 h-28 text-orange-500 mb-8" strokeWidth={1.5} />
      <h2 className="text-2xl font-medium text-orange-500 mb-4">
        ระบบได้รับข้อมูลของคุณเรียบร้อยแล้ว
      </h2>
      <p className="text-gray-500 text-center max-w-xl text-base leading-relaxed">
        ขณะนี้อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่
        <br />
        เมื่อการตรวจสอบเสร็จสิ้น คุณจะสามารถเข้าใช้งานระบบได้ทันที
      </p>
    </div>
  );

  const RegistrationForm = () => (
    <div className="min-h-screen pt-6 pb-4 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-14">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-base transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : isCompleted
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  <span className="text-sm text-gray-500 mt-3 whitespace-nowrap">{label}</span>
                </div>
                {s < stepLabels.length && (
                  <div
                    className={`w-40 h-0.5 mx-4 mb-8 transition-colors ${
                      step > s ? 'bg-gray-400' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {step === 1 && CommonStep1}
        {step === 2 && userType === 'student' && StudentStep2()}
        {step === 2 && userType === 'alumni' && AlumniStep2()}
        {step === 3 && SuccessStep()}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm mt-6 text-center">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            disabled={loading || step === 3}
            className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ย้อนกลับ
          </button>
          {step < 3 ? (
            <button
              onClick={onNext}
              disabled={loading}
              className="px-10 py-3 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังดำเนินการ...' : step === 2 ? 'ลงทะเบียน' : 'ถัดไป'}
            </button>
          ) : (
            <a
              href="/auth/login"
              className="px-10 py-3 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition inline-block font-medium"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (!userType) return <RegisterSelect />;

  return <RegistrationForm />;
}
