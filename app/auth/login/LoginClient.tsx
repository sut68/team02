"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginClient: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
        });
        
        // If user is already logged in, redirect away from login page
        if (response.ok) {
          router.replace('/user/news');
        }
      } catch (err) {
        // If there's an error checking auth, allow login page to show
        console.log('Auth check failed, showing login page');
      }
    };

    checkAuth();
  }, [router]);

  // Store and manage login state in sessionStorage
  useEffect(() => {
    if (loading) {
      sessionStorage.setItem('isLoginInProgress', 'true');
    } else {
      sessionStorage.removeItem('isLoginInProgress');
    }
  }, [loading]);

  // Prevent navigation while login is in progress
  useEffect(() => {
    if (!loading) return;

    // Prevent page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // Prevent back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('🔄 เริ่มต้นการเข้าสู่ระบบ...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        setLoading(false);
        return;
      }

      // Success - redirect based on user role
      console.log('✅ เข้าสู่ระบบสำเร็จ, กำลัง redirect...');
      console.log('User role:', data.user.role);
      
      // Check if there's a redirect parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      // Use redirect parameter if exists, otherwise redirect based on role
      let redirectUrl = '/user/news'; // default
      if (redirectParam) {
        redirectUrl = redirectParam;
      } else if (data.user.role === 'ADMIN') {
        redirectUrl = '/admin/usermanage';
      }
      
      console.log('Redirecting to:', redirectUrl);
      
      // Clear login flag and redirect
      sessionStorage.removeItem('isLoginInProgress');
      // Use window.location for immediate redirect
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="relative w-full h-screen">
        {/* Background Image - take ~60% width on md+ screens, full width on small screens */}
        <div
          className="absolute left-0 top-0 bottom-0 w-full md:w-4/5 bg-cover bg-center object-fit"
          style={{
            backgroundImage: "url('/25ver1.jpg')",
          }}
        />

        {/* Login Card - Positioned on the right */}
        <div className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-full max-w-md mx-4 md:mx-0">
          <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-14">
            <h1 className="text-3xl font-bold text-orange-500 text-center mb-2">
              ยินดีต้อนรับกลับมา :)
            </h1>
            <p className="text-gray-600 text-center text-sm mb-8">
              สานต่อความผูกพันจากวันวานและก้าวไปข้างหน้าร่วมกัน<br />
              กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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
                    placeholder="b6612345@g.sut.ac.th"
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
                  <a 
                    href="/auth/forgot-password" 
                    onClick={(e) => loading && e.preventDefault()}
                    className={`text-sm text-orange-500 hover:underline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>

              {/* Divider */}
              <div className="text-center text-sm text-gray-500">หรือ</div>

              {/* Register Link */}
              <div className="text-center text-sm text-gray-600">
                ยังไม่ได้เป็นสมาชิกใช่ไหม?{' '}
                <a 
                  href="/auth/register" 
                  onClick={(e) => loading && e.preventDefault()}
                  className={`text-orange-500 hover:underline font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  สมัครสมาชิกที่นี่
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginClient;