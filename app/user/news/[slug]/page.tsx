// app/user/news/[slug]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ---------- Types ----------
type ContentCategoryType =
  | "NEWS"
  | "EVENT"
  | "ANNOUNCEMENT"
  | "ACTIVITY"
  | "GENERAL";

type BookingOption = "HAVE" | "NOT";

type MetaItem = {
  label: string;
  value: string;
  type: "text" | "link";
  linkText?: string;
};

interface PictureContent {
  id: number;
  Path: string;
}

interface UserInfo {
  fullName?: string | null;
  name?: string | null;
}

// ถ้า API include bookingForm + bookings มาด้วย
interface BookingFormInfo {
  id: number;
  TotalSeats?: number | null;
}

interface BookingInfo {
  id: number;
  // เปลี่ยนชื่อ field seats ให้ตรงกับ model จริงของ bro ได้
  seats?: number | null;
}

interface ContentDetail {
  id: number;
  TitleName: string | null;
  Description: string | null;
  categories: ContentCategoryType | null;
  Booking: BookingOption | null;
  createdAt?: string;
  pictures: PictureContent[];
  user?: UserInfo | null;

  bookingForm?: BookingFormInfo | null;
  bookings?: BookingInfo[]; // optional
}

// ---------- helper แปลง enum เป็นข้อความไทย ----------
const categoryLabelMap: Record<ContentCategoryType, string> = {
  NEWS: "ข่าวประชาสัมพันธ์",
  EVENT: "กิจกรรม",
  ANNOUNCEMENT: "ประกาศ",
  ACTIVITY: "กิจกรรมทั่วไป",
  GENERAL: "ทั่วไป",
};

const bookingLabelMap: Record<BookingOption, string> = {
  HAVE: "มีแบบฟอร์มลงทะเบียน",
  NOT: "ไม่มีแบบฟอร์มลงทะเบียน",
};

const renderMetaItem = (item: MetaItem) => (
  <div key={item.label} className="py-2">
    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
    {item.type === "link" ? (
      <Link
        href={item.value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#F26522] text-sm hover:underline"
      >
        {item.linkText || item.value}
      </Link>
    ) : (
      <p className="text-sm text-gray-900">{item.value}</p>
    )}
  </div>
);

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next 16 ต้องใช้ use(params)
  const { slug } = use(params);
  const id = Number(slug); // ใช้ slug เป็น id

  const [data, setData] = useState<ContentDetail | null>(null);
  const [meta, setMeta] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (Number.isNaN(id)) {
        setError("รหัสข่าวไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/content?id=${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/content?id= error:", res.status, t);
          if (res.status === 404) {
            setError("ไม่พบข่าวที่ต้องการ");
          } else {
            setError("ไม่สามารถโหลดรายละเอียดข่าวได้");
          }
          setLoading(false);
          return;
        }

        const json = await res.json();
        const content: ContentDetail = json.content;

        if (!content) {
          setError("ไม่พบข่าวที่ต้องการ");
          setLoading(false);
          return;
        }

        setData(content);

        // สร้าง meta อัตโนมัติจากข้อมูลจริง
        const metaItems: MetaItem[] = [];

        if (content.categories) {
          metaItems.push({
            label: "หมวดหมู่",
            value: categoryLabelMap[content.categories],
            type: "text",
          });
        }

        if (content.Booking) {
          metaItems.push({
            label: "การลงทะเบียน",
            value: bookingLabelMap[content.Booking],
            type: "text",
          });
        }

        if (content.createdAt) {
          const date = new Date(content.createdAt);
          const thaiDate = date.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          metaItems.push({
            label: "เผยแพร่เมื่อ",
            value: thaiDate,
            type: "text",
          });
        }

        setMeta(metaItems);
      } catch (err) {
        console.error("Fetch content detail error:", err);
        setError("ไม่สามารถโหลดรายละเอียดข่าวได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // -------- คำนวณจำนวนที่นั่ง ----------
  const totalSeats =
    data?.bookingForm?.TotalSeats != null
      ? data.bookingForm.TotalSeats
      : null;

  const usedSeats =
    data?.bookings?.reduce(
      (sum, b) => sum + (b.seats != null ? b.seats : 0),
      0
    ) ?? 0;

  const remainingSeats =
    totalSeats != null ? Math.max(totalSeats - usedSeats, 0) : null;

  // ฟังก์ชันหา path รูปแรก
  const imageUrl = data?.pictures?.[0]?.Path || "/Content/Event6.jpg";

  const displayTitle = data?.TitleName || "(ไม่มีชื่อเรื่อง)";
  const displayDate =
    meta.find((m) => m.label === "เผยแพร่เมื่อ")?.value || "";

  const authorName =
    data?.user?.fullName ||
    data?.user?.name ||
    "ผู้ดูแลระบบข่าวสารและกิจกรรม";

  // ----------- state ตอนโหลด / error ----------
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <p className="text-gray-500">กำลังโหลดรายละเอียดข่าว...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <p className="text-red-500 mb-4">{error || "ไม่พบข่าวที่ต้องการ"}</p>
        <Link
          href="/news"
          className="text-[#F26522] hover:underline text-sm"
        >
          ← กลับไปหน้าข่าวทั้งหมด
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl text-left">
      {/* Title + Date */}
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
          {displayTitle}
        </h1>
        {displayDate && (
          <p className="text-sm text-gray-500">{displayDate}</p>
        )}
      </header>

      {/* Featured Image */}
      <div className="relative w-full aspect-4/3 sm:aspect-3/2 md:aspect-5/3 lg:aspect-2/1 mb-8 overflow-hidden rounded-lg shadow-xl">
        <Image
          src={imageUrl}
          alt={displayTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>

      {/* Content + Sidebar */}
      <div className="grid grid-cols-1 gap-8">
        {/* Content */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
            รายละเอียดกิจกรรม
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {data.Description || "-"}
          </p>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="space-y-3">
            {meta.length > 0 ? (
              meta.map(renderMetaItem)
            ) : (
              <p className="text-sm text-gray-500">ไม่มีข้อมูลเพิ่มเติม</p>
            )}
          </div>
        </aside>
      </div>

      {/* 🔶 กล่องลงทะเบียน (เฉพาะกรณีมีการลงทะเบียน) */}
      {data.Booking === "HAVE" && (
        <div className="mt-10 flex flex-col items-center">
          {/* กล่องตัวเลข */}
          <div className="border-2 border-[#F26522] rounded-3xl px-12 py-6 text-center max-w-sm w-full">
            <p className="text-sm text-gray-700 mb-2">ที่นั่งคงเหลือ</p>
            <p className="text-4xl font-bold text-[#F26522] leading-none mb-2">
              {remainingSeats != null ? remainingSeats : "-"}
            </p>
            {totalSeats != null && (
              <p className="text-sm text-gray-700">
                จาก {totalSeats} คน
              </p>
            )}
          </div>

          {/* ปุ่มลงทะเบียน */}
          <Link
            href={
              data.bookingForm?.id
                ? `/user/booking/${data.bookingForm.id}`
                : "#"
            } // 👈 เปลี่ยน path นี้ให้ตรงกับหน้าจองของ bro ได้
            className="mt-4 w-full max-w-sm"
          >
            <button className="w-full bg-[#F26522] text-white rounded-full py-3 text-center text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-60">
              ลงทะเบียนเข้าร่วม
            </button>
          </Link>
        </div>
      )}

      <hr className="mt-8 border-gray-200" />

      {/* Footer ผู้เขียน */}
      <footer className="mt-6 flex ">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-300 shrink-0" />

          {/* Author name */}
          <span className="text-base font-semibold text-[#F26522]">
            {authorName}
          </span>

          {/* Divider */}
          <span className="text-gray-300">|</span>

          {/* Label */}
          <span className="text-base text-gray-600">ผู้เขียน</span>
        </div>
      </footer>
    </div>
  );
}
