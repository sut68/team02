'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Book, Upload, UserCheck, UserCircle, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Input } from '@/app/components/ui/Input';
import { Card, CardContent } from '@/app/components/ui/Card';

// Password validation (same as backend)
function validatePasswordFrontend(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' };
  }
  return { valid: true };
}

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

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
        });
        
        // If user is already logged in, redirect away from register page
        if (response.ok) {
          router.replace('/user/news');
        }
      } catch (err) {
        // If there's an error checking auth, allow register page to show
        console.log('Auth check failed, showing register page');
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // แทน handleInputChange ด้วย onBlur
const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, [field]: file as any }));
  };

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
      // Password strength validation (frontend)
      const pwCheck = validatePasswordFrontend(formData.password);
      if (!pwCheck.valid) {
        setError(pwCheck.error || 'รหัสผ่านไม่ถูกต้อง');
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
      // Build multipart form data to support file upload
      const fd = new FormData();
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('fullName', formData.name);
      fd.append('phone', formData.phone);
      fd.append('address', formData.addressLine);
      fd.append('subdistrict', formData.subdistrict);
      fd.append('district', formData.district);
      fd.append('province', formData.province);
      fd.append('postalCode', formData.postalCode);
      fd.append('studentCode', formData.studentCode);
      fd.append('major', formData.major);
      fd.append('gradYear', formData.gradYear);
      fd.append('userType', userType || 'student');
      if (formData.transcript) {
        fd.append('transcript', formData.transcript);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();
      console.log('Register payload:', data);
      console.log('Register payload:', formData);


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

  // Step 1: Personal Information
  const renderStep1 = () => (
    <div className="grid grid-cols-2 gap-16">
      <div className="space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">ข้อมูลส่วนตัว</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            defaultValue={formData.name}
            onBlur={handleInputBlur}
            placeholder="ระบุชื่อและนามสกุล"
            required
            size="md"
            radius="md"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <Input
            name="email"
            type="email"
            defaultValue={formData.email}
            onBlur={handleInputBlur}
            placeholder="ระบุอีเมล (เช่น name@example.com)"
            required
            size="md"
            radius="md"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <Input
            name="password"
            type="password"
            defaultValue={formData.password}
            onBlur={handleInputBlur}
            placeholder="ความยาว 8 ตัวอักษรขึ้นไป (A-Z, a-z, 0-9)"
            required
            size="md"
            radius="md"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <Input
            name="confirmPassword"
            type="password"
            defaultValue={formData.confirmPassword}
            onBlur={handleInputBlur}
            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
            required
            size="md"
            radius="md"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-gray-800 mb-8 invisible">ที่อยู่</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ที่อยู่ <span className="text-red-500">*</span>
          </label>
          <Input
            name="addressLine"
            defaultValue={formData.addressLine}
            onBlur={handleInputBlur}
            placeholder="บ้านเลขที่ หมู่ อาคาร ซอย ถนน"
            required
            size="md"
            radius="md"
            autoComplete="street-address"
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              ตำบล <span className="text-red-500">*</span>
            </label>
            <Input
              name="subdistrict"
              defaultValue={formData.subdistrict}
              onBlur={handleInputBlur}
              placeholder="ระบุตำบล/แขวง"
              required
              size="md"
              radius="md"
              autoComplete="address-level3"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              อำเภอ <span className="text-red-500">*</span>
            </label>
            <Input
              name="district"
              defaultValue={formData.district}
              onBlur={handleInputBlur}
              placeholder="ระบุอำเภอ/เขต"
              required
              size="md"
              radius="md"
              autoComplete="address-level2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              จังหวัด <span className="text-red-500">*</span>
            </label>
            <Input
              name="province"
              defaultValue={formData.province}
              onBlur={handleInputBlur}
              placeholder="ระบุจังหวัด"
              required
              size="md"
              radius="md"
              autoComplete="address-level1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              รหัสไปรษณีย์ <span className="text-red-500">*</span>
            </label>
            <Input
              name="postalCode"
              defaultValue={formData.postalCode}
              onBlur={handleInputBlur}
              placeholder="รหัสไปรษณีย์ 5 หลัก"
              required
              size="md"
              radius="md"
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <Input
            name="phone"
            defaultValue={formData.phone}
            onBlur={handleInputBlur}
            placeholder="0xx-xxx-xxxx"
            required
            size="md"
            radius="md"
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );

const RegisterSelect = () => {
  const handleScrollDown = () => {
    const element = document.getElementById('member-benefits');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
  <>
    <div className="bg-white">
      <div className="min-h-screen w-full flex items-center justify-center py-2 px-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              สร้างบัญชีของคุณ
            </h1>
            <p className="text-gray-600 text-base md:text-lg font-normal max-w-3xl mx-auto">
              เลือกประเภทสมาชิกของคุณเพื่อเริ่มต้นการลงทะเบียนในระบบศิษย์เก่าสัมพันธ์วิศวกรรมศาสตร์
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-12 mb-20">
            {/* Alumni Card */}
            <div className="flex-1 max-w-sm">
              <Card
                className="cursor-pointer border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 h-full p-20"
                onClick={() => {
                  setUserType('alumni');
                  setStep(1);
                }}
              >
                <CardContent className="p-16 text-center flex flex-col items-center justify-center h-full gap-6">
                  <GraduationCap className="w-20 h-20 text-orange-500 hover:text-orange-600 transition-colors" strokeWidth={1.2} />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">ศิษย์เก่า</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      สำหรับผู้ที่จบการศึกษาแล้ว
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Card */}
            <div className="flex-1 max-w-sm">
              <Card
                className="cursor-pointer border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 h-full"
                onClick={() => {
                  setUserType('student');
                  setStep(1);
                }}
              >
                <CardContent className="p-16 text-center flex flex-col items-center justify-center h-full gap-6">
                  <UserCircle className="w-20 h-20 text-orange-500 hover:text-orange-600 transition-colors" strokeWidth={1.2} />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">ศิษย์ปัจจุบัน</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      สำหรับนักศึกษาปัจจุบันของสำนักวิศวกรรมศาสตร์
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={handleScrollDown}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-500 transition-colors duration-300 font-medium text-sm group cursor-pointer bg-none border-none p-0"
            >
              <span>ค้นหาประโยชน์ของการสมัครสมาชิก</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      <div id="member-benefits" className="min-h-screen w-full bg-white flex items-center justify-center py-12 px-4 border-t border-gray-100">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-20">
            <p className="text-gray-600 text-base font-semibold uppercase tracking-widest">ทำไมต้องเลือกเรา</p>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">ประสบการณ์ที่ยอดเยี่ยมสำหรับสมาชิก</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white p-8 border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-28 h-28 bg-orange-100 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-300 -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-orange-500 mb-6 shadow-md">
                  <Book className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">ข่าวสารและบทความ</h4>
                <p className="text-gray-600 text-base leading-relaxed">ได้รับข้อมูลข่าวสารคณะและบทความการศึกษาล่าสุดจากสาขาวิชาของคุณ</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white p-10 border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-28 h-28 bg-orange-100 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-300 -mr-14 -mt-14"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-orange-500 mb-6 shadow-md">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">เครือข่ายศิษย์</h4>
                <p className="text-gray-600 text-base leading-relaxed">ค้นหาและเชื่อมต่อกับเพื่อนร่วมรุ่น สร้างเครือข่ายมืออาชีพ</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white p-10 border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-28 h-28 bg-orange-100 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-300 -mr-14 -mt-14"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-orange-500 mb-6 shadow-md">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">กิจกรรมและอีเวนต์</h4>
                <p className="text-gray-600 text-base leading-relaxed">ร่วมมิติในกิจกรรมศิษย์เก่า สัมมนา และอีเวนต์พิเศษ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  );
};

  const StudentStep2 = () => (
    <div className="grid grid-cols-2 gap-16">
      <div className="space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">ประวัติการศึกษา</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสนักศึกษา <span className="text-red-500">*</span>
          </label>
          <Input
            name="studentCode"
            defaultValue={formData.studentCode}
            onBlur={handleInputBlur}
            placeholder="ระบุรหัสนักศึกษา (เช่น Bxxxxxxx)"
            required
            size="md"
            radius="md"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            สาขาวิชา <span className="text-red-500">*</span>
          </label>
          <Input
            name="major"
            defaultValue={formData.major}
            onBlur={handleInputBlur}
            placeholder="ระบุชื่อสาขาวิชา"
            required
            size="md"
            radius="md"
            autoComplete="off"
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
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">ข้อมูลส่วนตัว</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            รหัสนักศึกษา <span className="text-red-500">*</span>
          </label>
          <Input
            name="studentCode"
            defaultValue={formData.studentCode}
            onBlur={handleInputBlur}
            placeholder="ระบุรหัสนักศึกษา (เช่น Bxxxxxxx)"
            required
            size="md"
            radius="md"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            ปีที่จบการศึกษา <span className="text-red-500">*</span>
          </label>
          <Input
            name="gradYear"
            defaultValue={formData.gradYear}
            onBlur={handleInputBlur}
            placeholder="ระบุปี พ.ศ. (เช่น 2567)"
            required
            size="md"
            radius="md"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            สาขาวิชา <span className="text-red-500">*</span>
          </label>
          <Input
            name="major"
            defaultValue={formData.major}
            onBlur={handleInputBlur}
            placeholder="ระบุชื่อสาขาวิชา"
            required
            size="md"
            radius="md"
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
    <div className="flex flex-col items-center justify-center py-8">
      <UserCheck className="w-20 h-20 text-orange-500 mb-4" strokeWidth={1.5} />
      <h2 className="text-2xl font-medium text-orange-500 mb-2">
        ระบบได้รับข้อมูลของคุณเรียบร้อยแล้ว
      </h2>
      <p className="text-gray-500 text-center max-w-xl text-base leading-relaxed">
        ขณะนี้อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่<br />เมื่อการตรวจสอบเสร็จสิ้น คุณจะสามารถเข้าใช้งานระบบได้ทันที
      </p>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    if (step === 2) {
      handleRegister();
    } else {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const RegistrationForm = () => (
    <form onSubmit={handleSubmit} className="pt-18 pb-23 px-8" autoComplete="on" name="register">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-8">
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

        {/* Step 1: already has correct spacing. For step 2 and 3, wrap in spacing div */}
        {step === 1 && renderStep1()}
        {step === 2 && (
          <div className="mb-20">
            {userType === 'student' && StudentStep2()}
            {userType === 'alumni' && AlumniStep2()}
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col justify-center items-center min-h-[380px]">
            {SuccessStep()}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm mt-6 text-center">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            disabled={loading || step === 3}
            className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ย้อนกลับ
          </button>
          {step < 3 ? (
            <button
              type="submit"
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
    </form>
  );

  if (!userType) return <RegisterSelect />;

  return <RegistrationForm />;
}

