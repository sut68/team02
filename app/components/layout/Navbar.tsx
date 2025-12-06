"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<{
    isAuthenticated: boolean;
    role: string;
    name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status (เรียกแค่ครั้งแรกเท่านั้น)
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // Skip auth check on auth pages to avoid 401 errors
      if (pathname?.startsWith('/auth/')) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });
        if (response.ok && isMounted) {
          const userData = await response.json();
          setUser({
            isAuthenticated: true,
            role: userData.role,
            name: userData.fullName,
          });
        } else if (isMounted) {
          setUser(null);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const isAdmin = useMemo(() => user?.isAuthenticated && user?.role?.toUpperCase() === 'ADMIN', [user]);
  const isLoggedIn = useMemo(() => user?.isAuthenticated, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/login');
      window.location.href = '/auth/login'; // Force reload
    } catch (error) {
      // Silent error
    }
  }, [router]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY === 0) {
            setIsScrolled(false);
          } else {
            setIsScrolled(true);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ----------------------------------------------------
  // Component ย่อย: ชุดเมนู (แสดงผลตาม Role)
  // ----------------------------------------------------
  const DesktopMenu = useMemo(() => {
    if (loading) {
      return (
        <div className="hidden md:flex space-x-10 text-gray-700 font-medium item-center min-h-6">
          {/* Placeholder to prevent layout shift */}
        </div>
      );
    }

    return (
      <div className="hidden md:flex space-x-10 text-gray-700 font-medium item-center">

        {/* --- เมนูสำหรับผู้ใช้ทั่วไป --- */}
        {!isAdmin && (
          <>
            <div className="relative group">
              <Link href="/user/news" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
                <span className="material-icons ml-1 text-base">กิจกรรม</span>
              </Link>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                <Link href="/user/booking" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">จองเข้าร่วมกิจกรรม</Link>
                <Link href="/user/news/submission" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ขอโพสกิจกรรม</Link>
                <Link href="/#souvenir" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ของที่ระลึก</Link>
              </div>
            </div>

            <Link href="/user/job" className="hover:text-gray-900">รับสมัครงาน</Link>

            <div className="relative group">
              <span className="flex items-center hover:text-[#F26522] transition-colors duration-200 cursor-pointer">
                การระดมทุน
              </span>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                <Link href="/user/donation" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ระดมทุน</Link>
                <Link href="/user/donation/#donation" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">การบริจาค</Link>
              </div>
            </div>

            <Link href="/budget" className="hover:text-gray-900">รายงานงบประมาณ</Link>
            <Link href="/user/talk" className="hover:text-gray-900">กระดานสนทนา</Link>
          </>
        )}

      {/* --- 💡 เมนูสำหรับแอดมิน (จะแสดงเมื่อ isAdmin = true) --- */}
      {isAdmin && (
        <>
          <div className="relative group">
            <Link href="/user/news" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">กิจกรรม</span>
            </Link>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/admin/news/create" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">สร้างโพส</Link>
              <Link href="/admin/news" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">อนุมัติโพส</Link>
              <Link href="/admin/news" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">รายละเอียดการจอง</Link>
            </div>
          </div>

          <div className="relative group">
            <Link href="/admin/souvenir" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">ของที่ระลึก</span>
            </Link>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/admin/souvenir/activity" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">กิจกรรม</Link>
              <Link href="/admin/souvenir/donation" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">บริจาค</Link>
            </div>
          </div>

          <Link href="/user/job" className="hover:text-gray-900">รับสมัครงาน</Link>

          <div className="relative group/l0">
            <span className="flex items-center hover:text-[#F26522] transition-colors duration-200 cursor-pointer">
              การระดมทุนและงบ
            </span>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover/l0:opacity-100 invisible group-hover/l0:visible transition-all duration-200 z-50">
              <div className="relative group/l1">
                <span className="w-full flex justify-between items-center px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200 cursor-pointer">
                  การระดมทุน
                </span>
                <div className="absolute left-full top-0 mt-0 w-48 bg-white shadow-lg group-hover/l1:opacity-100 invisible group-hover/l1:visible transition-all duration-200 z-50">
                  <Link href="/admin/budget_approval" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">พิจารณา</Link>
                  <Link href="/admin/budget_report" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">รายงานงบ</Link>
                </div>
              </div>
              <Link href="/admin/donation" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                บริจาค
              </Link>
              <Link href="/admin/payment" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                การเงิน
              </Link>
            </div>
          </div>

          <Link href="/admin/talk" className="hover:text-gray-900">กระดานสนทนา</Link>
          <Link href="/admin/usermanage" className="hover:text-gray-900">จัดการสมาชิก</Link>
        </>
      )}

        {/* --- เมนู Login/Profile/Logout --- */}
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              {user?.name && (
                <div className="relative group">
                  <span className="text-gray-500 cursor-pointer hover:text-[#F26522] transition-colors duration-200">
                    สวัสดี, {user.name}
                  </span>
                  <div className="absolute left-0 mt-2 w-52 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link href="/user/editprofile" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                      แก้ไขโปรไฟล์
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-[#F26522] hover:bg-gray-100 hover:text-orange-700 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="bg-[#F26522] text-white py-2 px-4 rounded hover:bg-orange-700">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

      </div>
    );
  }, [loading, isAdmin, isLoggedIn, user, handleLogout]);

  // ----------------------------------------------------
  // 💡 Main Component Render
  // ----------------------------------------------------
  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-white shadow z-50 transition-all duration-300
        ${isScrolled ? "py-2" : "py-6"}`}
    >
      <div className="flex justify-between items-center px-6">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center ml-20 space-x-4 transition-all duration-300">
            <Image
              className="dark:invert"
              src="/SUT_Engineering_Eng.png"
              alt="ENGi logo"
              width={isScrolled ? 150 : 200}
              height={isScrolled ? 30 : 40}
              style={{ width: 'auto', height: 'auto' }}
              priority
              loading="eager"
            />
          </div>
        </Link>

        {/* 💡 แสดงเมนู Desktop (ที่ตรวจสอบ Role แล้ว) */}
        {DesktopMenu}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="material-icons">{isOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-100 flex flex-col items-center md:hidden py-4">
          <Link href="/" className="py-2" onClick={() => setIsOpen(false)}>หน้าแรก</Link>
          <Link href="/apply" className="py-2" onClick={() => setIsOpen(false)}>รับสมัครงาน</Link>
          <Link href="/fund" className="py-2" onClick={() => setIsOpen(false)}>ระดมทุนและบริจาค</Link>
          <Link href="/budget" className="py-2" onClick={() => setIsOpen(false)}>รายงานงบประมาณ</Link>
          <Link href="/forum" className="py-2" onClick={() => setIsOpen(false)}>กระดานสนทนา</Link>

          {/* 💡 เมนูแอดมินใน Mobile */}
          {!loading && isAdmin && (
            <Link href="/admin" className="py-2 font-bold text-red-600" onClick={() => setIsOpen(false)}>
              แผงควบคุมแอดมิน
            </Link>
          )}

          <Link href={isLoggedIn ? "/profile" : "/auth/login"} className="py-2" onClick={() => setIsOpen(false)}>
            {loading ? "กำลังโหลด..." : (isLoggedIn ? "โปรไฟล์" : "เข้าสู่ระบบ")}
          </Link>
        </div>
      )}
    </nav>
  );
}