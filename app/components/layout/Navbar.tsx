"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 💡 1. สถานะผู้ใช้ (จำลอง)
  // (ในโปรเจกต์จริง คุณต้องดึงค่านี้มาจาก Auth Context หรือ Session)
  const [user, setUser] = useState({
    isAuthenticated: true, // ทดสอบการล็อกอิน
    role: 'admi',         // 👈 ลองเปลี่ยนเป็น 'user' หรือ 'admin' เพื่อทดสอบ
  });

  // 💡 2. ตัวแปรตรวจสอบ Role (นี่คือ Logic ที่คุณต้องการ)
  const isAdmin = user.isAuthenticated && user.role === 'admin';
  const isLoggedIn = user.isAuthenticated;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ----------------------------------------------------
  // Component ย่อย: ชุดเมนู (แสดงผลตาม Role)
  // ----------------------------------------------------
  const DesktopMenu = () => (
    <div className="hidden md:flex space-x-10 text-gray-700 font-medium item-center"
    >

      {/* --- เมนูสำหรับผู้ใช้ทั่วไป --- */}
      {!isAdmin && (
        <>
          <div className="relative group">
            <Link href="/apply" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">กิจกรรม</span>
            </Link>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/apply" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">จองเข้าร่วมกิจกรรม</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ขอโพสกิจกรรม</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ของที่ระลึก</Link>
            </div>
          </div>

          <Link href="/forum" className="hover:text-gray-900">รับสมัครงาน</Link>

          <div className="relative group">
            <button className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">การระดมทุน</span>
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/donation" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">ระดมทุน</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">การบริจาค</Link>
            </div>
          </div>

          <Link href="/budget" className="hover:text-gray-900">รายงานงบประมาณ</Link>
          <Link href="/login" className="hover:text-gray-900">กระดานสนทนา</Link>
        </>
      )}

      {/* --- 💡 เมนูสำหรับแอดมิน (จะแสดงเมื่อ isAdmin = true) --- */}
      {isAdmin && (
        <>
          <div className="relative group">
            <Link href="/apply" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">กิจกรรม</span>
            </Link>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/apply" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">สร้างโพส</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">อนุมัติโพส</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">รายละเอียดการจอง</Link>
            </div>
          </div>

          <div className="relative group">
            <Link href="/apply" className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">ของที่ระลึก</span>
            </Link>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link href="/apply" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">กิจกรรม</Link>
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">บริจาค</Link>
            </div>
          </div>

          <Link href="/forum" className="hover:text-gray-900">รับสมัครงาน</Link>
          {/* 💡 1. L0: ตั้งชื่อ group เป็น group/l0 */}
          <div className="relative group/l0">
            {/* L0: ปุ่มหลัก "การระดมทุนและงบ" */}
            <button className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">การระดมทุนและงบ</span>
            </button>

            {/* 💡 2. L1: Dropdown Container (ฟัง group-hover/l0) */}
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover/l0:opacity-100 invisible group-hover/l0:visible transition-all duration-200 z-50">

              {/* 💡 3. L1 Item 1: "การระดมทุน" (ตั้งชื่อ group/l1) */}
              <div className="relative group/l1">
                {/* ปุ่มสำหรับเปิดเมนู L2 */}
                <button className="w-full flex justify-between items-center px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                  <span className="material-icons ml-1 text-base">การระดมทุน</span>
                  {/* <span className="material-icons text-sm">chevron_right</span> */}
                </button>

                {/* 💡 4. L2: Dropdown (ฟัง group-hover/l1) */}
                <div className="absolute left-full top-0 mt-0 w-48 bg-white shadow-lg group-hover/l1:opacity-100 invisible group-hover/l1:visible transition-all duration-200 z-50">
                  <Link href="/apply" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">พิจารณา</Link>
                  <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">รายงานงบ</Link>
                </div>
              </div>

              {/* L1 Item 2: "บริจาค" */}
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                บริจาค
              </Link>

              {/* L1 Item 3: "การเงิน" */}
              <Link href="/fund" className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200">
                การเงิน
              </Link>

            </div>
          </div>

          {/* <Link href="/budget" className="hover:text-gray-900">รายงานงบประมาณ</Link> */}
          <Link href="/login" className="hover:text-gray-900">กระดานสนทนา</Link>
        </>
      )}

      {/* --- เมนู Login/Profile --- */}
      {isLoggedIn ? (
        <Link href="/profile" className="hover:text-gray-900 mr-6">
          โปรไฟล์
        </Link>
      ) : (
        <Link href="/login" className="bg-[#F26522] text-white py-2 px-4 rounded hover:bg-orange-700">
          เข้าสู่ระบบ
        </Link>
      )}

    </div>
  );

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
            />
          </div>
        </Link>

        {/* 💡 แสดงเมนู Desktop (ที่ตรวจสอบ Role แล้ว) */}
        <DesktopMenu />

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
          {isAdmin && (
            <Link href="/admin" className="py-2 font-bold text-red-600" onClick={() => setIsOpen(false)}>
              แผงควบคุมแอดมิน
            </Link>
          )}

          <Link href={isLoggedIn ? "/profile" : "/login"} className="py-2" onClick={() => setIsOpen(false)}>
            {isLoggedIn ? "โปรไฟล์" : "เข้าสู่ระบบ"}
          </Link>
        </div>
      )}
    </nav>
  );
}