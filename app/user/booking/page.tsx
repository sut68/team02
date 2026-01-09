"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { PrimaryButton, CancelButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// ---------- Types ----------
type ContentCategoryType = "NEWS" | "EVENT" | "ANNOUNCEMENT" | "ACTIVITY" | "GENERAL";
type BookingOption = "HAVE" | "NOT";
type PriceMode = "SINGLE" | "BY_BATCH" | "FREE";
type Option = "HAVE" | "NOT";
type EventType = "REUNION" | "CAMP" | "SEMINAR" | "WORKSHOP" | "OTHER";

interface PictureContent {
  id: number;
  Path: string;
}

interface BookingFormDTO {
  id: number;
  Type: EventType | null;
  BatchNumber: number | null;
  TotalSeats: number | null;
  StartDate: string | null;
  EndDate: string | null;
  PriceType: PriceMode | null;
  singlePrice?: number | null;
  batchPrices?: any | null;
  Souvenir: Option | null;
}

interface ContentDetail {
  id: number;
  TitleName: string | null;
  Description: string | null;
  categories: ContentCategoryType | null;
  Booking: BookingOption | null;
  createdAt?: string;
  pictures: PictureContent[];
  bookingForm?: BookingFormDTO | null;
}

type MeUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
};

// ---------- UI helpers ----------
const FormLabel = ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor: string; className?: string; }) => (
  <label htmlFor={htmlFor} className={`block text-sm text-gray-500 mb-1 ${className || ""}`}>
    {children}
  </label>
);

const FormSelect = ({ id, value, onChange, options, disabled }: { id: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; options: { label: string; value: string }[]; disabled?: boolean; }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition disabled:bg-gray-100 disabled:text-gray-500"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

function formatThaiDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function getBatchUnitPrice(batchPrices: any, batchNumberStr: string): number | null {
  if (!batchPrices || !batchNumberStr) return null;
  const batchNumber = Number(batchNumberStr);
  const batchNumberIsNum = Number.isFinite(batchNumber) && !Number.isNaN(batchNumber);

  if (Array.isArray(batchPrices) && batchNumberIsNum) {
    for (const row of batchPrices) {
      const start = Number(row?.startBatch);
      const end = Number(row?.endBatch);
      const price = Number(row?.price);
      if (Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(price) && batchNumber >= start && batchNumber <= end) {
        return price;
      }
    }
  }

  if (typeof batchPrices === "object") {
    if (batchNumberIsNum && batchPrices[batchNumberStr] != null) {
      const p = Number(batchPrices[batchNumberStr]);
      return Number.isFinite(p) ? p : null;
    }
    if (batchPrices[batchNumberStr] != null) {
      const p = Number(batchPrices[batchNumberStr]);
      return Number.isFinite(p) ? p : null;
    }
  }
  return null;
}

function UserBookingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get("contentId") ?? searchParams.get("id");
  const contentId = contentIdParam ? Number(contentIdParam) : null;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    batchNumber: "",
    fullName: "",
    gift: false,
    notes: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setUser(json?.user ?? json);
        }
      } catch (e) {
        console.error("fetch user error:", e);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      if (!contentId) {
        setErrorText("ไม่พบรหัสกิจกรรมสำหรับการจอง");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/content?id=${contentId}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setContent(json.content);
        } else {
          setErrorText("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
        }
      } catch (err) {
        setErrorText("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [contentId]);

  const bookingForm = content?.bookingForm ?? null;
  const canBook = content?.Booking === "HAVE" && !!bookingForm && !!user;
  const souvenirEnabled = bookingForm?.Souvenir === "HAVE";

  const batchSelectOptions = useMemo(() => {
    const bn = bookingForm?.BatchNumber ?? null;
    if (!bn || bn <= 0) return null;
    return [
      { label: "เลือกรุ่น", value: "" },
      ...Array.from({ length: bn }, (_, i) => ({ label: `รุ่นที่ ${i + 1}`, value: String(i + 1) })),
    ];
  }, [bookingForm?.BatchNumber]);

  const handleChange = (e: any) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const pricing = useMemo(() => {
    const priceType = bookingForm?.PriceType;
    if (priceType === "FREE") return { unitPrice: 0, totalPrice: 0 };
    if (priceType === "SINGLE") {
      const unit = bookingForm?.singlePrice ?? 0;
      return { unitPrice: unit, totalPrice: unit };
    }
    if (priceType === "BY_BATCH") {
      const unit = getBatchUnitPrice(bookingForm?.batchPrices, formData.batchNumber) ?? 0;
      return { unitPrice: unit, totalPrice: unit };
    }
    return { unitPrice: 0, totalPrice: 0 };
  }, [bookingForm, formData.batchNumber]);

  const resetForm = () => setFormData({ batchNumber: "", fullName: "", gift: false, notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentId || !bookingForm || !user?.id) return;

    if (bookingForm.PriceType === "BY_BATCH" && !formData.batchNumber) {
      alert("กรุณาเลือกรุ่นก่อน");
      return;
    }

    const name = formData.fullName.trim();
    if (!name) {
      alert("กรุณากรอกชื่อ-สกุล");
      return;
    }

    try {
      const payload = {
        userId: user.id,
        contentId,
        bookingField: {
          batchNumber: formData.batchNumber || null,
          bookingSeats: 1,
          name,
          note: formData.notes || null,
          souvenir: souvenirEnabled ? (formData.gift ? "HAVE" : "NOT") : "NOT",
          totalPrice: pricing.totalPrice,
        },
      };

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
const bookingId = json.booking?.id;
const paymentId = json.paymentId; // ต้องตรงกับที่ API ส่งกลับมา

if (pricing.totalPrice === 0) {
    router.push(`/user/booking/success?bookingId=${bookingId}`);
} else {
    // ส่งไปหน้าชำระเงินพร้อม ID ที่จำเป็น
    router.push(`/user/payment?paymentId=${paymentId}&bookingId=${bookingId}`);
}
    } catch (err: any) {
      alert("จองไม่สำเร็จ: " + err.message);
    }
  };

  const firstImage = content?.pictures?.[0]?.Path ?? null;
  const startText = formatThaiDate(bookingForm?.StartDate);
  const endText = formatThaiDate(bookingForm?.EndDate);

  return (
    <div className="container mx-auto px-4 py-10">
      {loading && <p className="text-gray-500 text-sm mb-4">กำลังโหลดข้อมูล...</p>}
      {!loadingUser && !user && <p className="text-red-500 text-sm mb-4">ยังไม่ได้เข้าสู่ระบบ</p>}
      {errorText && <p className="text-red-500 text-sm mb-4">{errorText}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ซ้าย: รายละเอียดกิจกรรม */}
        <div className="bg-gray-50 rounded-xl p-6 lg:col-span-1 w-full">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              {content?.TitleName || (loading ? "กำลังโหลด..." : "ไม่พบชื่อกิจกรรม")}
            </h1>

            {(startText || endText) && (
              <div className="text-gray-700">
                <p className="text-lg font-semibold">
                  {startText}
                  {endText ? ` – ${endText}` : ""}
                </p>
              </div>
            )}

            {firstImage ? (
              <Image
                src={firstImage}
                alt={content?.TitleName || "content image"}
                width={1200}
                height={700}
                className="w-full h-auto rounded-lg object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full aspect-video rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                ไม่มีรูปภาพ
              </div>
            )}

            <div className="text-m text-gray-600 whitespace-pre-line">
              {content?.Description || (!loading ? "ไม่มีรายละเอียด" : "")}
            </div>

            {bookingForm && (
              <div className="pt-2 text-sm text-gray-600 space-y-1">
                {bookingForm.Type && <p>ประเภทกิจกรรม: {bookingForm.Type}</p>}
                {typeof bookingForm.TotalSeats === "number" && (
                  <p>จำนวนที่นั่งทั้งหมด: {bookingForm.TotalSeats}</p>
                )}
                {bookingForm.BatchNumber != null && (
                  <p>จำนวนรุ่นทั้งหมด: {bookingForm.BatchNumber}</p>
                )}
                {bookingForm.PriceType && (
                  <p>รูปแบบราคา: {bookingForm.PriceType}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <Card className="shadow-md rounded-xl border border-gray-200 bg-white">
            <CardHeader className="text-2xl font-bold text-gray-800 text-left">ลงทะเบียนเข้าร่วมกิจกรรม</CardHeader>
            <CardContent className="p-6">
              {!canBook && !loading && <p className="text-sm text-gray-500 mb-4 text-left">ไม่สามารถลงทะเบียนได้ในขณะนี้</p>}
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                {batchSelectOptions && (
                  <div>
                    <FormLabel htmlFor="batchNumber">รุ่น</FormLabel>
                    <FormSelect id="batchNumber" value={formData.batchNumber} onChange={handleChange} options={batchSelectOptions} disabled={!canBook || bookingForm?.PriceType !== "BY_BATCH"} />
                  </div>
                )}
                <div>
                  <FormLabel htmlFor="fullName">ชื่อ-สกุล</FormLabel>
                  <Input id="fullName" placeholder="กรอกชื่อ-สกุล" value={formData.fullName} onChange={handleChange} disabled={!canBook} />
                </div>
                {souvenirEnabled && (
                  <div className="flex items-center pt-2">
                    <Input id="gift" type="checkbox" checked={formData.gift} onChange={handleChange} className="h-5 w-5 text-orange-500" disabled={!canBook} />
                    <FormLabel htmlFor="gift" className="ml-2 text-gray-700 mb-0">ของที่ระลึก</FormLabel>
                  </div>
                )}
                <div>
                  <FormLabel htmlFor="notes">หมายเหตุ</FormLabel>
                  <textarea id="notes" value={formData.notes} onChange={handleChange} rows={4} disabled={!canBook} className="w-full border border-gray-300 p-3 text-sm rounded-md focus:border-orange-400 outline-none transition" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
                  <div className="flex justify-between text-sm"><span>ราคา/ที่นั่ง</span><span className="font-semibold">{pricing.unitPrice.toLocaleString()} บาท</span></div>
                  <div className="flex justify-between text-sm"><span>ราคารวม</span><span className="font-bold text-[#F26522]">{pricing.totalPrice.toLocaleString()} บาท</span></div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <CancelButton type="button" onClick={resetForm}>ยกเลิก</CancelButton>
                  <PrimaryButton type="submit" disabled={!canBook}>ยืนยัน</PrimaryButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function UserBookingPage() {
  return <Suspense fallback={<p>Loading...</p>}><UserBookingPageInner /></Suspense>;
}