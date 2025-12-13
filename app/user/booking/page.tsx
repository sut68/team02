// app/user/booking/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { PrimaryButton, CancelButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

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

// ---------- Types ----------
type ContentCategoryType =
  | "NEWS"
  | "EVENT"
  | "ANNOUNCEMENT"
  | "ACTIVITY"
  | "GENERAL";

type BookingOption = "HAVE" | "NOT";

interface PictureContent {
  id: number;
  Path: string;
}

interface ContentDetail {
  id: number;
  TitleName: string | null;
  Description: string | null;
  categories: ContentCategoryType | null;
  Booking: BookingOption | null;
  createdAt?: string;
  pictures: PictureContent[];
}

type MetaItem = {
  label: string;
  value: string;
  type: "text" | "link";
  linkText?: string;
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

const FormSelect = ({ id, value, onChange, options }: any) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    // ใช้สไตล์ให้คล้าย Input component
    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 
               focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
  >
    {options.map((opt: string, index: number) => (
      <option key={index} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

export default function UserBookingPage() {
  const searchParams = useSearchParams();
  const contentIdParam =
    searchParams.get("contentId") ?? searchParams.get("id");
  const contentId = contentIdParam ? Number(contentIdParam) : null;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [errorContent, setErrorContent] = useState<string | null>(null);

  // ---------- ดึงข้อมูลข่าว / กิจกรรม ----------
  useEffect(() => {
    const fetchContent = async () => {
      if (!contentId || Number.isNaN(contentId)) {
        setErrorContent("ไม่พบรหัสกิจกรรมสำหรับการจอง");
        setLoadingContent(false);
        return;
      }

      try {
        const res = await fetch(`/api/content?id=${contentId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/content?id= error:", res.status, t);
          setErrorContent("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
          setLoadingContent(false);
          return;
        }

        const json = await res.json();
        const data: ContentDetail | undefined = json.content;

        if (!data) {
          setErrorContent("ไม่พบข้อมูลกิจกรรม");
          setLoadingContent(false);
          return;
        }

        setContent(data);
      } catch (err) {
        console.error("fetch content error:", err);
        setErrorContent("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [contentId]);

  // map ให้เข้ากับโครงเดิมของหน้า
  const displayTitle =
    content?.TitleName || (errorContent ? "ไม่พบกิจกรรม" : "กำลังโหลด...");
  const displayDate =
    content?.createdAt && !errorContent
      ? new Date(content.createdAt).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
  const imageUrl =
    content?.pictures?.[0]?.Path || "/Content/Event6.jpg"; // fallback
  const displayContent = content?.Description || "";

  const data = {
    title: displayTitle,
    date: displayDate,
    imageUrl,
    content: displayContent,
  };

  // ---------- ฟอร์มเดิม ----------
  const [formData, setFormData] = useState({
    studentYear: "รุ่นปีการศึกษา",
    seats: "1",
    fullName: "",
    gift: false,
    notes: "",
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? target.checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: ตรงนี้ค่อยเปลี่ยนเป็นเรียก API จองจริง
    alert("ยืนยันการลงทะเบียน: " + JSON.stringify(formData, null, 2));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* ถ้ามี error เรื่อง content แจ้งด้านบนเบา ๆ */}
      {errorContent && (
        <p className="text-red-500 text-sm mb-4">{errorContent}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ------------------------------------------------------ */}
        {/* คอลัมน์ซ้าย: รายละเอียดกิจกรรม (โครงเดิม)           */}
        {/* ------------------------------------------------------ */}
        <div className="bg-gray-50 rounded-xl p-6  lg:col-span-1 w-full">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
              {data.title}
            </h1>
            {data.date && (
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {data.date}
              </h1>
            )}

            <Image
              src={data.imageUrl}
              alt={data.title}
              width={300}
              height={100}
              sizes=" "
            />

            <h3 className="text-m text-gray-600 mb-2 whitespace-pre-line">
              {data.content}
            </h3>
          </div>
        </div>

        {/* ------------------------------------------------------ */}
        {/* คอลัมน์ขวา: ฟอร์มลงทะเบียน (โครงเดิม)               */}
        {/* ------------------------------------------------------ */}
        <div>
          <Card className="shadow-md rounded-xl border border-gray-200 bg-white">
            <CardHeader className="text-2xl font-bold text-gray-800">
              ลงทะเบียนเข้าร่วมกิจกรรม
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* รุ่นปีการศึกษา (Select Component) */}
                <div>
                  <FormLabel htmlFor="studentYear">รุ่นปีการศึกษา</FormLabel>
                  <FormSelect
                    id="studentYear"
                    value={formData.studentYear}
                    onChange={handleChange}
                    options={[
                      "รุ่นปีการศึกษา",
                      "Generation 1-7",
                      "Generation 8-14",
                    ]}
                  />
                </div>

                {/* จำนวนที่นั่ง (Select Component) */}
                <div>
                  <FormLabel htmlFor="seats">จำนวนที่นั่ง</FormLabel>
                  <FormSelect
                    id="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    options={["1", "2", "3", "4", "มากกว่า 4"]}
                  />
                </div>

                {/* ชื่อ-สกุล (ใช้ Input Component) */}
                <div>
                  <FormLabel htmlFor="fullName">ชื่อ-สกุล</FormLabel>
                  <Input
                    id="fullName"
                    placeholder="กรอกชื่อ-สกุล"
                    value={formData.fullName}
                    onChange={handleChange}
                    size="md"
                  />
                </div>

                {/* ของที่ระลึก (Checkbox - ใช้ Input Component) */}
                <div className="flex items-center pt-2">
                  <Input
                    id="gift"
                    type="checkbox"
                    checked={formData.gift}
                    onChange={handleChange}
                    className="h-5 w-5 rounded focus:ring-orange-400 text-orange-500 border-gray-300"
                  />
                  <FormLabel htmlFor="gift" className="ml-2 text-gray-700">
                    ของที่ระลึก
                  </FormLabel>
                </div>

                {/* ความต้องการพิเศษ/หมายเหตุ */}
                <div>
                  <FormLabel htmlFor="notes">
                    ความต้องการพิเศษ/หมายเหตุ
                  </FormLabel>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 bg-transparent placeholder-gray-400 transition-all outline-none 
                               focus:outline-none focus:border-orange-400 px-4 py-3 text-sm rounded-md resize-y"
                  />
                </div>

                {/* ปุ่ม */}
                <div className="flex justify-end space-x-4 pt-4">
                  <CancelButton
                    onClick={() =>
                      setFormData({
                        studentYear: "รุ่นปีการศึกษา",
                        seats: "1",
                        fullName: "",
                        gift: false,
                        notes: "",
                      })
                    }
                  >
                    ยกเลิก
                  </CancelButton>
                  <PrimaryButton type="submit">ยืนยัน</PrimaryButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}