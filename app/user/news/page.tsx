// app/news/News.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { PrimaryButton } from "../../components/ui/Button";
import { SouvenirSection } from "../souvenir/SouvenirSection";

type ContentCategoryType =
  | "NEWS"
  | "ACTIVITY";

type BookingOption = "HAVE" | "NOT";

interface PictureContent {
  id: number;
  Path: string;
}

interface ContentItem {
  id: number;
  slug?: string|null; //ถ้าใช้ title url อาจจะยาวๆแปลกๆเพราะเราอาจตั้งชื่อเป็ฯภาษาไทย 
  TitleName: string | null;//แต่ slugจะแปลงชื่อเรื่องให้เป็น eng ที่รองรับ url ทั้งหมด url จะได้สะอาด
  Description: string | null;
  categories: ContentCategoryType | null;
  Booking: BookingOption | null;
  pictures: PictureContent[];
}

function useAuth() {
  const [user, setUser] = useState<{
    isAuthenticated: boolean;
    role: string;
    name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (response.ok) {
          const data = await response.json();
          const rawRole = (data.role || data.userType || "").toString();
          const normalizedRole = rawRole.toLowerCase();

          setUser({
            isAuthenticated: true,
            role: normalizedRole,
            name: data.name || data.fullName,
          });
        } else {
          setUser({ isAuthenticated: false, role: "" });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser({ isAuthenticated: false, role: "" });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    isLoggedIn: user?.isAuthenticated || false,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
    loading,
  };
}

export function News() {
  const { isLoggedIn, isAdmin } = useAuth();

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [errorContent, setErrorContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await fetch("/api/content", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/content error:", res.status, t);
          throw new Error("โหลดข่าวไม่สำเร็จ");
        }

        const data = await res.json();
        setContents(data.contents || []);
      } catch (err) {
        console.error("Fetch contents error:", err);
        setErrorContent("ไม่สามารถโหลดข่าวสารได้ในขณะนี้");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContents();
  }, []);

  // ========= แบ่งโพสต์ =========
  const featured = contents[0] || null;
  const secondary = contents[1] || null;
  const archives = contents.slice(2, 4);     // index 2–3 = ใหม่แต่รองลงมา

  const oldPosts = contents.slice(4);        // ตั้งแต่ index 4 ขึ้นไป = โพสต์เก่า
  const upcoming = oldPosts
    .filter((c) => c.Booking !== "HAVE")     // เอาเฉพาะที่ "ไม่มีการลงทะเบียน"
    .slice(0, 3);                            // แสดงได้ 3 วงกลม

  const getFirstImage = (item: ContentItem | null | undefined) =>
    item?.pictures?.[0]?.Path || "/Content/Event6.jpg";

  const getTitle = (item: ContentItem | null | undefined) =>
    item?.TitleName || "(ไม่มีชื่อเรื่อง)";

  const getDesc = (item: ContentItem | null | undefined) =>
    item?.Description || "";

  return (
    <>
    <section className="container mx-auto mb-16 px-4 py-0 ">
      {/* 🔶 Full-width Banner */}
            <div className="relative w-screen h-[600px] left-[50%] right-[50%] mb-25 -ml-[50vw] -mr-[50vw] overflow-hidden">
              <Image
                src="/18.jpg"
                alt="Home"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Text Container */}
              <div className="absolute inset-0 flex flex-col justify-end items-start text-left p-8 md:p-16 font-sans">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mb-4 drop-shadow-lg">
                  AlumniConnect
                </h1>
                <p className="text-lg md:text-xl text-white/75 max-w-2xl font-light leading-relaxed drop-shadow-md">
                  เชื่อมโยงศิษย์เก่าและมหาวิทยาลัย สร้างเครือข่ายที่เข้มแข็ง <br className="hidden md:block" />
                  เพื่ออนาคตที่ยั่งยืนและการเรียนรู้ตลอดชีวิต
                </p>
              </div>
            </div>
      

        {/* หัวข้อ + ปุ่ม */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800">
            ข่าวสารและกิจกรรม
          </h2>

          {isLoggedIn && !isAdmin && (
            <Link href="/user/news/submission">
              <PrimaryButton>คำขอยื่นเรื่อง</PrimaryButton>
            </Link>
          )}

          {isLoggedIn && isAdmin && (
            <Link href="/admin/news">
              <PrimaryButton>รายละเอียด</PrimaryButton>
            </Link>
          )}
        </div>

        {loadingContent && (
          <p className="text-gray-500 mb-6">กำลังโหลดข่าวสาร...</p>
        )}
        {errorContent && !loadingContent && (
          <p className="text-red-500 mb-6">{errorContent}</p>
        )}
        {!loadingContent && !errorContent && contents.length === 0 && (
          <p className="text-gray-500 mb-6">ยังไม่มีข่าวสารในระบบ</p>
        )}

        {/* ============ แถวบน: โพสต์ใหม่ ============ */}
        {contents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr">
            {/* Featured */}
            {featured && (
              <Link
                href={`/user/news/${featured.slug || featured.id}`}
                className="lg:col-span-6 block group h-full"
              >
                <Card className="h-full overflow-hidden p-0! rounded-2xl shadow-md bg-white flex flex-col">
                  <div className="relative w-full h-60 md:h-72 shrink-0">
                    <Image
                      src={getFirstImage(featured)}
                      alt={getTitle(featured)}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px)100vw,50vw"
                    />
                  </div>
                  <div className="p-5 grow">
                    <CardHeader className="mb-2! text-lg! md:text-xl! font-semibold group-hover:text-orange-600 transition">
                      {getTitle(featured)}
                    </CardHeader>
                    <CardContent className="p-0! text-sm text-gray-600 line-clamp-3">
                      {getDesc(featured)}
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Secondary */}
            {secondary && (
              <Link
                href={`/user/news/${secondary.slug || secondary.id}`}
                className="lg:col-span-3 block group h-full"
              >
                <Card className="h-full overflow-hidden p-0! rounded-2xl shadow-md bg-white flex flex-col">
                  <div className="relative w-full h-60 md:h-72 shrink-0">
                    <Image
                      src={getFirstImage(secondary)}
                      alt={getTitle(secondary)}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px)100vw,25vw"
                    />
                  </div>
                  <div className="p-5 grow">
                    <CardHeader className="mb-2! text-lg! md:text-xl! font-semibold group-hover:text-orange-600 transition">
                      {getTitle(secondary)}
                    </CardHeader>
                    <CardContent className="p-0! text-sm text-gray-600 line-clamp-3">
                      {getDesc(secondary)}
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Archives */}
            <aside className="lg:col-span-3 space-y-6 flex flex-col h-full">
              {archives.map((item) => (
                <Link
                  key={item.id}
                  href={`/user/news/${item.slug || item.id}`}
                  className="block group grow"
                >
                  <Card className="overflow-hidden p-0! rounded-2xl shadow-md bg-white flex flex-col h-full">
                    <div className="relative w-full h-32 shrink-0">
                      <Image
                        src={getFirstImage(item)}
                        alt={getTitle(item)}
                        fill
                        className="object-cover"
                        sizes="20vw"
                      />
                    </div>
                    <div className="p-4 grow">
                      <p className="text-sm font-medium text-gray-800 leading-snug group-hover:text-orange-600 transition">
                        {getTitle(item)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </aside>
          </div>
        )}

        {/* ============ แถวล่าง: โพสต์เก่า + ไม่มีการลงทะเบียน ============ */}
        {upcoming.length > 0 && (
          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcoming.map((event) => (
                <Link
                  key={event.id}
                  href={`/user/news/${event.slug || event.id}`}
                  className="block group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-sm shrink-0">
                      <Image
                        src={getFirstImage(event)}
                        alt={getTitle(event)}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 leading-snug group-hover:text-orange-600 transition">
                        {getTitle(event)}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#F26522]">
                        <span>ดูรายละเอียด</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px]">
                          ↗
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

    {/* ส่วนของที่ระลึก */}
    <div id="souvenir" className="scroll-mt-28">
      <SouvenirSection />
    </div>
  </>
  );
}

export default News;