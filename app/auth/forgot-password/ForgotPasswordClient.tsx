'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full">
        <div className="relative w-full h-screen">
          {/* Background Image */}
          <div
            className="absolute left-0 top-0 bottom-0 w-full md:w-4/5 bg-cover bg-center object-fit"
            style={{ backgroundImage: "url('/25ver1.jpg')" }}
          />
          {/* Card */}
          <div className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md mx-4 md:mx-0">
            <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-14 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-orange-500 mb-2">ตรวจสอบอีเมลของคุณ</h1>
                <p className="text-gray-600">
                  หากอีเมล <span className="font-semibold text-orange-600">{email}</span> มีในระบบ<br />
                  เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปแล้ว
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  <strong>กรุณาตรวจสอบ:</strong>
                  <br />• กล่องจดหมาย Inbox
                  <br />• โฟลเดอร์ Spam/Junk
                  <br />• ลิงก์จะหมดอายุใน 1 ชั่วโมง
                </p>
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="relative w-full h-screen">
        {/* Background Image */}
        <div
          className="absolute left-0 top-0 bottom-0 w-full md:w-4/5 bg-cover bg-center object-fit"
          style={{ backgroundImage: "url('/25ver1.jpg')" }}
        />
        {/* Card */}
        <div className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md mx-4 md:mx-0">
          <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-14">
            <h1 className="text-3xl font-bold text-orange-500 text-center mb-2">
              ลืมรหัสผ่าน?
            </h1>
            <p className="text-gray-600 text-center text-sm mb-8">
              กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-700 mb-2">ที่อยู่อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="justin.alumni@gmail.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    ส่งลิงก์รีเซ็ตรหัสผ่าน
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
