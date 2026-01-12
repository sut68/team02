"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PrimaryButton } from "@/app/components/ui/Button";

// ---------- Types ----------
type ContentCategoryType = "NEWS" | "EVENT" | "ANNOUNCEMENT" | "ACTIVITY" | "GENERAL";
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

interface BookingFormInfo {
  id: number;
  TotalSeats?: number | null;
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
  // ✅ เพิ่มฟิลด์รองรับ Count จาก API
  _count?: {
    bookings: number;
  };
}

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
  <div key={item.label} className="py-2 text-left">
    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
    {item.type === "link" ? (
      <Link href={item.value} target="_blank" rel="noopener noreferrer" className="text-[#F26522] text-sm hover:underline">
        {item.linkText || item.value}
      </Link>
    ) : (
      <p className="text-sm text-gray-900">{item.value}</p>
    )}
  </div>
);

export default function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<ContentDetail | null>(null);
  const [meta, setMeta] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/content?id=${slug}`, { cache: "no-store" });
        if (!res.ok) {
          setError(res.status === 404 ? "ไม่พบข่าวที่ต้องการ" : "ไม่สามารถโหลดรายละเอียดข่าวได้");
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

        const metaItems: MetaItem[] = [];
        if (content.categories) metaItems.push({ label: "หมวดหมู่", value: categoryLabelMap[content.categories], type: "text" });
        if (content.Booking) metaItems.push({ label: "การลงทะเบียน", value: bookingLabelMap[content.Booking], type: "text" });
        if (content.createdAt) {
          const thaiDate = new Date(content.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
          metaItems.push({ label: "เผยแพร่เมื่อ", value: thaiDate, type: "text" });
        }
        setMeta(metaItems);
      } catch (err) {
        setError("ไม่สามารถโหลดรายละเอียดข่าวได้");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

const totalSeats = data?.bookingForm?.TotalSeats ?? 0;
const usedSeats = data?._count?.bookings ?? 0; // ดึงค่าจาก _count ที่เราเพิ่งแก้ใน API
const remainingSeats = totalSeats > 0 ? Math.max(totalSeats - usedSeats, 0) : 0;

  if (loading) return <div className="container mx-auto py-10 px-4 max-w-4xl text-gray-500">กำลังโหลดรายละเอียดข่าว...</div>;
  if (error || !data) return <div className="container mx-auto py-10 px-4 max-w-4xl"><p className="text-red-500 mb-4">{error}</p><Link href="/news" className="text-[#F26522] hover:underline text-sm">← กลับไปหน้าข่าวทั้งหมด</Link></div>;

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl text-left">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{data.TitleName || "(ไม่มีชื่อเรื่อง)"}</h1>
        {meta.find((m) => m.label === "เผยแพร่เมื่อ")?.value && <p className="text-sm text-gray-500">{meta.find((m) => m.label === "เผยแพร่เมื่อ")?.value}</p>}
      </header>

      <div className="relative w-full aspect-video mb-8 overflow-hidden rounded-lg shadow-xl">
        <Image src={data.pictures?.[0]?.Path || "/Content/Event6.jpg"} alt={data.TitleName || ""} fill className="object-cover" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">รายละเอียดกิจกรรม</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{data.Description || "-"}</p>
        </div>
        <aside className="space-y-4">{meta.map(renderMetaItem)}</aside>
      </div>

      {/* 🔶 กล่องแสดงที่นั่งคงเหลือ */}
      {data.Booking === "HAVE" && (
        <div className="mt-10 flex flex-col items-center">
          <div className="border-2 border-[#F26522] rounded-3xl px-12 py-8 text-center max-w-sm w-full shadow-sm">
            <p className="text-base text-gray-700 mb-3 font-medium">ที่นั่งคงเหลือ</p>
            <div className="flex items-baseline justify-center gap-1">
              <p className="text-5xl font-extrabold text-[#F26522] leading-none">
                {remainingSeats.toLocaleString()}
              </p>
              <span className="text-gray-600 text-sm font-medium">ที่นั่ง</span>
            </div>
          </div>

          <Link href={`/user/booking?contentId=${data.id}`} className="mt-4 w-full max-w-sm">
            <PrimaryButton 
              disabled={remainingSeats <= 0} 
              className="w-full bg-[#F26522] text-white rounded-full py-3 text-center text-sm font-semibold hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            >
              {remainingSeats <= 0 ? "ที่นั่งเต็มแล้ว" : "ลงทะเบียนเข้าร่วม"}
            </PrimaryButton>
          </Link>
        </div>
      )}

      <hr className="mt-8 border-gray-200" />
      <footer className="mt-6 flex items-center gap-4">
        <span className="text-base font-semibold text-[#F26522]">{data.user?.fullName || data.user?.name || "ผู้ดูแลระบบ"}</span>
        <span className="text-gray-300">|</span>
        <span className="text-base text-gray-600">ผู้เขียน</span>
      </footer>
    </div>
  );
}