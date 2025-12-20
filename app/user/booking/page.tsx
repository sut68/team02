// app/user/booking/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { PrimaryButton, CancelButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// ---------- Types ----------
type ContentCategoryType =
  | "NEWS"
  | "EVENT"
  | "ANNOUNCEMENT"
  | "ACTIVITY"
  | "GENERAL";

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
  BatchNumber: number | null; // ✅ จำนวน “รุ่น” ทั้งหมด
  TotalSeats: number | null;
  StartDate: string | null;
  EndDate: string | null;
  PriceType: PriceMode | null;
  singlePrice?: number | null;
  batchPrices?: any | null; // Json
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
const FormLabel = ({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm text-gray-500 mb-1 ${className || ""}`}
  >
    {children}
  </label>
);

const FormSelect = ({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 
               focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition
               disabled:bg-gray-100 disabled:text-gray-500"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

function formatThaiDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * ✅ หา price ของรุ่นที่เลือก จาก bookingForm.batchPrices (JSON)
 * รองรับ 2 รูปแบบ:
 * 1) Array: [{ startBatch: 1, endBatch: 7, price: 100 }, ...]
 * 2) Object map: { "1": 100, "2": 120 } หรือ { "Generation 1-7": 100 }
 */
function getBatchUnitPrice(batchPrices: any, batchNumberStr: string): number | null {
  if (!batchPrices || !batchNumberStr) return null;

  // ถ้าเลือกเป็นตัวเลข "1" "2" ...
  const batchNumber = Number(batchNumberStr);
  const batchNumberIsNum = Number.isFinite(batchNumber) && !Number.isNaN(batchNumber);

  // 1) Array ranges
  if (Array.isArray(batchPrices) && batchNumberIsNum) {
    for (const row of batchPrices) {
      const start = Number(row?.startBatch);
      const end = Number(row?.endBatch);
      const price = Number(row?.price);
      if (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        Number.isFinite(price) &&
        batchNumber >= start &&
        batchNumber <= end
      ) {
        return price;
      }
    }
  }

  // 2) Object map
  if (typeof batchPrices === "object") {
    // key เป็นเลข
    if (batchNumberIsNum && batchPrices[batchNumberStr] != null) {
      const p = Number(batchPrices[batchNumberStr]);
      return Number.isFinite(p) ? p : null;
    }
    // key เป็น string label
    if (batchPrices[batchNumberStr] != null) {
      const p = Number(batchPrices[batchNumberStr]);
      return Number.isFinite(p) ? p : null;
    }
  }

  return null;
}

function UserBookingPageInner() {
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get("contentId") ?? searchParams.get("id");
  const contentId = contentIdParam ? Number(contentIdParam) : null;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // ✅ ดึง user จาก auth (ไม่ hardcode userId)
  const [user, setUser] = useState<MeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const json = await res.json();
        const u = (json?.user ?? json) as MeUser | null;
        if (u?.id) setUser(u);
        else setUser(null);
      } catch (e) {
        console.error("fetch /api/auth/me error:", e);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    run();
  }, []);

  // ---------- Fetch content ----------
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorText(null);

      if (!contentId || Number.isNaN(contentId)) {
        setErrorText("ไม่พบรหัสกิจกรรมสำหรับการจอง");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/content?id=${contentId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/content error:", res.status, t);
          setErrorText("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
          setLoading(false);
          return;
        }

        const json = await res.json();
        const data: ContentDetail | undefined = json.content;
        if (!data) {
          setErrorText("ไม่พบข้อมูลกิจกรรม");
          setLoading(false);
          return;
        }

        setContent(data);
      } catch (err) {
        console.error(err);
        setErrorText("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [contentId]);

  const bookingForm = content?.bookingForm ?? null;

  // ✅ กฎว่า “จองได้ไหม”
  const canBook = content?.Booking === "HAVE" && !!bookingForm && !!user;

  // ✅ Seats options: สร้างจาก TotalSeats จริง
  const seatSelectOptions = useMemo(() => {
    const total = bookingForm?.TotalSeats ?? null;
    if (!total || total <= 0) return null;

    return Array.from({ length: total }, (_, i) => {
      const v = String(i + 1);
      return { label: v, value: v };
    });
  }, [bookingForm?.TotalSeats]);

  const souvenirEnabled = bookingForm?.Souvenir === "HAVE";

  // ✅ Batch options: สร้างจาก BookingForm.BatchNumber (จำนวนรุ่น)
  const batchSelectOptions = useMemo(() => {
    const bn = bookingForm?.BatchNumber ?? null;
    if (!bn || bn <= 0) return null;

    // รุ่น = 1..bn (ไม่ฮาร์ดโค้ด label)
    return [
      { label: "เลือกรุ่น", value: "" },
      ...Array.from({ length: bn }, (_, i) => {
        const v = String(i + 1);
        return { label: `รุ่นที่ ${v}`, value: v };
      }),
    ];
  }, [bookingForm?.BatchNumber]);

  // ---------- Form state ----------
  const [formData, setFormData] = useState<{
    batchNumber: string; // ✅ รุ่นที่เลือก
    seats: number;
    fullName: string;
    gift: boolean;
    notes: string;
  }>({
    batchNumber: "",
    seats: 1,
    fullName: "",
    gift: false,
    notes: "",
  });

  const [attendeeNames, setAttendeeNames] = useState<string[]>(["", "", "", ""]);

  // ถ้า TotalSeats มี แล้ว seats เกิน => ปรับให้ไม่เกิน
  useEffect(() => {
    const total = bookingForm?.TotalSeats ?? null;
    if (total && formData.seats > total) {
      setFormData((p) => ({ ...p, seats: total }));
    }
    if (formData.seats < 1) {
      setFormData((p) => ({ ...p, seats: 1 }));
    }
  }, [bookingForm?.TotalSeats]); // eslint-disable-line react-hooks/exhaustive-deps

  // ถ้าไม่ให้ของที่ระลึก ให้ปิด gift
  useEffect(() => {
    if (!souvenirEnabled && formData.gift) {
      setFormData((p) => ({ ...p, gift: false }));
    }
  }, [souvenirEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => {
      if (id === "seats") {
        const n = Number(value);
        return { ...prev, seats: Number.isFinite(n) ? n : 1 };
      }
      if (type === "checkbox") {
        return { ...prev, [id]: target.checked } as any;
      }
      return { ...prev, [id]: value } as any;
    });
  };

  // ✅ คำนวณ unit price + total price จาก bookingForm จริง
  const pricing = useMemo(() => {
    const priceType = bookingForm?.PriceType ?? null;

    const seats = Number(formData.seats) || 1;

    // FREE
    if (priceType === "FREE") {
      return { unitPrice: 0, totalPrice: 0, reason: "FREE" as const };
    }

    // SINGLE
    if (priceType === "SINGLE") {
      const sp = bookingForm?.singlePrice ?? null;
      const unit = typeof sp === "number" ? sp : 0;
      return {
        unitPrice: unit,
        totalPrice: unit * seats,
        reason: "SINGLE" as const,
      };
    }

    // BY_BATCH
    if (priceType === "BY_BATCH") {
      const bn = formData.batchNumber;
      const unit = getBatchUnitPrice(bookingForm?.batchPrices, bn) ?? 0;
      return {
        unitPrice: unit,
        totalPrice: unit * seats,
        reason: "BY_BATCH" as const,
      };
    }

    return { unitPrice: 0, totalPrice: 0, reason: "UNKNOWN" as const };
  }, [bookingForm?.PriceType, bookingForm?.singlePrice, bookingForm?.batchPrices, formData.batchNumber, formData.seats]);

  const resetForm = () => {
    setFormData({
      batchNumber: "",
      seats: 1,
      fullName: "",
      gift: false,
      notes: "",
    });
    setAttendeeNames(["", "", "", ""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentId || !content?.bookingForm || !user?.id) return;

    // ถ้าต้องเลือก batch แต่ยังไม่เลือก ให้กันไว้
    if (content.bookingForm.PriceType === "BY_BATCH" && !formData.batchNumber) {
      alert("กรุณาเลือกรุ่นก่อน");
      return;
    }

    const names = attendeeNames
      .map((n) => (typeof n === "string" ? n.trim() : ""))
      .filter((n) => n !== "");

    const payload = {
      userId: user.id,
      contentId: contentId,
      // (ถ้า API /api/booking รองรับ bookingFormId ก็ใส่ได้ แต่ของ bro ไม่บังคับ)
      bookingField: {
        batchNumber: formData.batchNumber || null,
        bookingSeats: Number(formData.seats),

        name1: attendeeNames[0]?.trim() || null,
        name2: attendeeNames[1]?.trim() || null,
        name3: attendeeNames[2]?.trim() || null,
        name4: attendeeNames[3]?.trim() || null,

        note: formData.notes || null,
        souvenir:
          content.bookingForm.Souvenir === "HAVE"
            ? formData.gift
              ? "HAVE"
              : "NOT"
            : "NOT",

        // ✅ ส่งราคาเข้า BookingField
        totalPrice: pricing.totalPrice,
      },
      attendees: names,
    };

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      alert("จองไม่สำเร็จ: " + t);
      return;
    }

    const json = await res.json();
    alert("จองสำเร็จ ✅ bookingId=" + json.booking?.id);
    resetForm();
  };

  // ---------- Render data ----------
  const title = content?.TitleName ?? "";
  const desc = content?.Description ?? "";
  const firstImage = content?.pictures?.[0]?.Path ?? null;

  const createdAtText = formatThaiDate(content?.createdAt ?? null);
  const startText = formatThaiDate(bookingForm?.StartDate ?? null);
  const endText = formatThaiDate(bookingForm?.EndDate ?? null);

  return (
    <div className="container mx-auto px-4 py-10">
      {loading && (
        <p className="text-gray-500 text-sm mb-4">กำลังโหลดข้อมูล...</p>
      )}

      {!loadingUser && !user && (
        <p className="text-red-500 text-sm mb-4">
          ยังไม่ได้เข้าสู่ระบบ (ไม่พบข้อมูลผู้ใช้)
        </p>
      )}

      {errorText && <p className="text-red-500 text-sm mb-4">{errorText}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ซ้าย: รายละเอียดกิจกรรม */}
        <div className="bg-gray-50 rounded-xl p-6 lg:col-span-1 w-full">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              {title || (loading ? "กำลังโหลด..." : "ไม่พบชื่อกิจกรรม")}
            </h1>

            {(startText || endText || createdAtText) && (
              <div className="text-gray-700">
                {startText || endText ? (
                  <p className="text-lg font-semibold">
                    {startText}
                    {endText ? ` – ${endText}` : ""}
                  </p>
                ) : (
                  <p className="text-lg font-semibold">{createdAtText}</p>
                )}
              </div>
            )}

            {firstImage ? (
              <Image
                src={firstImage}
                alt={title || "content image"}
                width={1200}
                height={700}
                className="w-full h-auto rounded-lg object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full aspect-[16/9] rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                ไม่มีรูปภาพ
              </div>
            )}

            <div className="text-m text-gray-600 whitespace-pre-line">
              {desc || (!loading ? "ไม่มีรายละเอียด" : "")}
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
                {bookingForm.PriceType && <p>รูปแบบราคา: {bookingForm.PriceType}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ขวา: ฟอร์มลงทะเบียน */}
        <div>
          <Card className="shadow-md rounded-xl border border-gray-200 bg-white">
            <CardHeader className="text-2xl font-bold text-gray-800">
              ลงทะเบียนเข้าร่วมกิจกรรม
            </CardHeader>

            <CardContent className="p-6">
              {!canBook && !loading && (
                <p className="text-sm text-gray-500 mb-4">
                  กิจกรรมนี้ยังไม่พร้อมให้ลงทะเบียน (ไม่ได้เปิด Booking, ไม่มี bookingForm,
                  หรือยังไม่ได้เข้าสู่ระบบ)
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ✅ รุ่น (มาจาก bookingForm.BatchNumber) */}
                {batchSelectOptions && (
                  <div>
                    <FormLabel htmlFor="batchNumber">รุ่น</FormLabel>
                    <FormSelect
                      id="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      options={batchSelectOptions}
                      disabled={!canBook || bookingForm?.PriceType !== "BY_BATCH"}
                    />
                    {bookingForm?.PriceType === "BY_BATCH" && (
                      <p className="text-xs text-gray-400 mt-1">
                        เลือกรุ่นเพื่อคำนวณราคา
                      </p>
                    )}
                  </div>
                )}

                {/* จำนวนที่นั่ง */}
                <div>
                  <FormLabel htmlFor="seats">จำนวนที่นั่ง</FormLabel>

                  {seatSelectOptions ? (
                    <FormSelect
                      id="seats"
                      value={String(formData.seats)}
                      onChange={handleChange}
                      options={seatSelectOptions}
                      disabled={!canBook}
                    />
                  ) : (
                    <Input
                      id="seats"
                      type="number"
                      value={formData.seats}
                      onChange={handleChange}
                      min={1}
                      max={bookingForm?.TotalSeats ?? undefined}
                      size="md"
                      disabled={!canBook}
                    />
                  )}

                  {typeof bookingForm?.TotalSeats === "number" &&
                    bookingForm.TotalSeats > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        สูงสุด {bookingForm.TotalSeats} ที่นั่ง
                      </p>
                    )}
                </div>

                {/* ชื่อ-สกุล */}
                <div>
                  <FormLabel htmlFor="fullName">ชื่อ-สกุล</FormLabel>
                  <Input
                    id="fullName"
                    placeholder="กรอกชื่อ-สกุล"
                    value={formData.fullName}
                    onChange={handleChange}
                    size="md"
                    disabled={!canBook}
                  />
                </div>

                {/* ผู้เข้าร่วม 4 ช่อง */}
                {attendeeNames.map((value, index) => (
                  <div key={index}>
                    <FormLabel htmlFor={`attendee-${index}`}>
                      ผู้เข้าร่วมคนที่ {index + 1}
                    </FormLabel>
                    <Input
                      id={`attendee-${index}`}
                      placeholder={`กรอกชื่อผู้เข้าร่วมคนที่ ${index + 1}`}
                      value={value}
                      onChange={(e) => {
                        const next = [...attendeeNames];
                        next[index] = e.target.value;
                        setAttendeeNames(next);
                      }}
                      size="md"
                      disabled={!canBook}
                    />
                  </div>
                ))}

                {/* ของที่ระลึก */}
                {souvenirEnabled && (
                  <div className="flex items-center pt-2">
                    <Input
                      id="gift"
                      type="checkbox"
                      checked={formData.gift}
                      onChange={handleChange}
                      className="h-5 w-5 rounded focus:ring-orange-400 text-orange-500 border-gray-300"
                      disabled={!canBook}
                    />
                    <FormLabel htmlFor="gift" className="ml-2 text-gray-700">
                      ของที่ระลึก
                    </FormLabel>
                  </div>
                )}

                {/* หมายเหตุ */}
                <div>
                  <FormLabel htmlFor="notes">ความต้องการพิเศษ/หมายเหตุ</FormLabel>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    disabled={!canBook}
                    className="w-full border border-gray-300 bg-transparent placeholder-gray-400 transition-all outline-none 
                               focus:outline-none focus:border-orange-400 px-4 py-3 text-sm rounded-md resize-y
                               disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                {/* ✅ ราคา (คำนวณอัตโนมัติ ไม่ hardcode) */}
                {!!bookingForm?.PriceType && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">ราคา/ที่นั่ง</span>
                      <span className="font-semibold text-gray-800">
                        {pricing.unitPrice.toLocaleString("th-TH")} บาท
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">ราคารวม</span>
                      <span className="font-bold text-[#F26522]">
                        {pricing.totalPrice.toLocaleString("th-TH")} บาท
                      </span>
                    </div>
                    {bookingForm.PriceType === "BY_BATCH" && !formData.batchNumber && (
                      <p className="mt-2 text-xs text-red-500">
                        * ต้องเลือกรุ่นก่อน เพื่อคำนวณราคา
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <CancelButton type="button" onClick={resetForm}>
                    ยกเลิก
                  </CancelButton>
                  <PrimaryButton type="submit" disabled={!canBook}>
                    ยืนยัน
                  </PrimaryButton>
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
  return (
    <Suspense>
      <UserBookingPageInner />
    </Suspense>
  );
}
