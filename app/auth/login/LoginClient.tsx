"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginClient: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = () => {
    console.log('login with', formData);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="relative w-full h-screen">
        {/* Background Image - take ~60% width on md+ screens, full width on small screens */}
        <div
          className="absolute left-0 top-0 bottom-0 w-full md:w-4/5 bg-cover bg-center object-fit"
          style={{
            backgroundImage: "url('/auth_photo/Login.jpg')",
          }}
        />

        {/* Login Card - Positioned on the right */}
        <div className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md mx-4 md:mx-0">
          <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-14">
            <h1 className="text-3xl font-bold text-orange-500 text-center mb-2">
              ยินดีต้อนรับกลับมา :)
            </h1>
            <p className="text-gray-600 text-center text-sm mb-8">
              สานต่อความสุขเพื่อนจากนำมาและก้าวไปข้างหน้าร่วมกัน<br />
              กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ
            </p>

            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">ที่อยู่อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="justin.alumni@gmail.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <a href="#" className="text-sm text-orange-500 hover:underline">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleLogin}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium"
              >
                เข้าสู่ระบบ
              </button>

              {/* Divider */}
              <div className="text-center text-sm text-gray-500">หรือ</div>

              {/* Register Link */}
              <div className="text-center text-sm text-gray-600">
                ยังไม่ได้เป็นสมาชิกใช่ไหม?{' '}
                <a href="/auth/register" className="text-orange-500 hover:underline font-medium">
                  สมัครสมาชิกที่นี่
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginClient;