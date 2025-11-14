"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setIsScrolled(false); // อยู่บนสุด → ขยาย Navbar
      } else {
        setIsScrolled(true);  // ไม่ใช่บนสุด → ย่อค้าง
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-white shadow z-50 transition-all duration-300
        ${isScrolled ? "py-2" : "py-10"}`}
    >
      <div className="flex justify-between items-center px-6">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center ml-20 space-x-4 transition-all duration-300">
            <Image
              className="dark:invert"
              src="/SUT_Engineering_Eng.png"
              alt="ENGi logo"
              width={isScrolled ? 150 : 200} // ย่อ/ขยายโลโก้
              height={isScrolled ? 30 : 40}
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 text-gray-700 font-medium items-center">
          {/* Hover Dropdown */}
          <div className="relative group">
            <button className="flex items-center hover:text-[#F26522] transition-colors duration-200">
              <span className="material-icons ml-1 text-base">การระดมทุน</span>
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <Link
                href="/apply"
                className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200"
              >
                ระดมทุน
              </Link>
              <Link
                href="/fund"
                className="block px-4 py-2 hover:bg-gray-100 hover:text-[#F26522] transition-colors duration-200"
              >
                การบริจาค
              </Link>
            </div>
          </div>

          <Link href="/budget" className="hover:text-gray-900">รายงานงบประมาณ</Link>
          <Link href="/forum" className="hover:text-gray-900">กระดานสนทนา</Link>
          <Link href="/login" className="hover:text-gray-900">เข้าสู่ระบบ</Link>
        </div>

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
          <Link href="/login" className="py-2" onClick={() => setIsOpen(false)}>เข้าสู่ระบบ</Link>
        </div>
      )}
    </nav>
  );
}
