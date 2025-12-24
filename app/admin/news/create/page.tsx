// app/post/edit/page.tsx

'use client';

import { useState,useEffect ,ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { PrimaryButton, CancelButton } from '../../../components/ui/Button';
import {
  Image as ImageIcon,
  Text,
  CheckCircle2,
} from 'lucide-react';

type ContentCategoryType =
  | 'NEWS'
  | 'EVENT'
  | 'ANNOUNCEMENT'
  | 'ACTIVITY'
  | 'GENERAL';

type Option = 'HAVE' | 'NOT';

type PostData = {
  title: string;
  date: string;
  body: string;
  coverImageUrl: string;   // รูปหลัก
  extraImages: string[];   // รูปประกอบหลายรูป
  categories: ContentCategoryType;
  Booking: Option;
};

import { Suspense } from 'react';

function EditPostPageInner() {
  const searchParams = useSearchParams();
  const bookingFormId = searchParams.get('bookingFormId');
  const router = useRouter();
  const currentUserId = 1;
  const bookingFormIdFromQuery = searchParams.get('bookingFormId');
  const [postData, setPostData] = useState<PostData>({
    title: '',
    date: '',
    body: '',
    coverImageUrl: '',
    extraImages: [],
    categories: 'NEWS', // default
    Booking: 'NOT',     // ยังไม่ต้องลงทะเบียน
  });

  const [isBookingConfigured, setIsBookingConfigured] = useState(false);
  useEffect(() => {
    if (bookingFormId) {
      setPostData((prev) => ({
        ...prev,
        Booking: 'HAVE',   // ถ้ามี bookingForm แสดงว่าต้องลงทะเบียนแน่นอน
      }));
      setIsBookingConfigured(true); // ให้โชว์ไอคอนติ๊กถูก
    }
  }, [bookingFormId]);

  // สำหรับ text field (ตามโครงเดิม)
  const handleFieldChange = (field: 'title' | 'date' | 'body', value: string) => {
    setPostData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // เปลี่ยนหมวดหมู่
  const handleCategoryChange = (value: ContentCategoryType) => {
    setPostData((prev) => ({
      ...prev,
      categories: value,
    }));
  };

  // เปลี่ยน Booking option
  const handleBookingChange = (value: Option) => {
    setPostData((prev) => ({
      ...prev,
      Booking: value,
    }));
  };
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [extraImageFiles, setExtraImageFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  // รูปหลัก (กล่องใหญ่ตรงกลาง)
  const handleMainImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const file = e.target.files[0];
  setMainImageFile(file);

  const url = URL.createObjectURL(file);

  setPostData((prev) => ({
    ...prev,
    coverImageUrl: url,
    extraImages: prev.extraImages.length ? prev.extraImages : [url],
  }));

  // ถ้าไม่มีภาพอื่น ให้เพิ่มเข้า extraImageFiles ด้วย
  setExtraImageFiles((prev) => (prev.length ? prev : [file]));

  // เคลียร์ข้อความเออเร่อถ้ามีภาพถูกอัปโหลด
  setErrorMsg(null);
};



 const handleExtraImagesUpload = (e: ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const files = Array.from(e.target.files);

  setExtraImageFiles((prev) => [...prev, ...files]);

  const urls = files.map((f) => URL.createObjectURL(f));

  setPostData((prev) => ({
    ...prev,
    extraImages: [...prev.extraImages, ...urls],
    coverImageUrl: prev.coverImageUrl || urls[0],
  }));

  // เคลียร์ข้อความเออเร่อถ้ามีภาพถูกอัปโหลด
  setErrorMsg(null);
};


  const handlePublish = async () => {
  // client-side: require at least one image before submitting
  if (extraImageFiles.length === 0 && !mainImageFile && postData.extraImages.length === 0) {
    setErrorMsg("ต้องอัปโหลดรูปอย่างน้อย 1 รูป");
    alert("❌ ต้องอัปโหลดรูปอย่างน้อย 1 รูป");
    return;
  }
  setErrorMsg(null);

  const formData = new FormData();

  formData.append("title", postData.title);
  formData.append("description", postData.body);
  formData.append("categories", postData.categories);
  formData.append("booking", postData.Booking);
  formData.append("userId", String(currentUserId));

  // ✅ ส่ง bookingFormId เฉพาะตอน "ต้องลงทะเบียน"
  if (postData.Booking === "HAVE") {
    if (!bookingFormIdFromQuery) {
      alert("ต้องกรอก/เลือก Booking Form ก่อน (ยังไม่มี bookingFormId)");
      return;
    }
    formData.append("bookingFormId", bookingFormIdFromQuery);
  }
  // ❌ ถ้า NOT: ไม่ต้อง append bookingFormId เลย

  extraImageFiles.forEach((file) => formData.append("pictures", file));
  if (mainImageFile && !extraImageFiles.includes(mainImageFile)) {
    formData.append("pictures", mainImageFile);
  }

  const res = await fetch("/api/content", { method: "POST", body: formData });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    alert("❌ สร้างเนื้อหาไม่สำเร็จ: " + (data?.error || "Bad Request"));
    return;
  }

  alert("🎉 เผยแพร่โพสต์สำเร็จ!");
  router.push("/admin/news");
};

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          สร้างโพสต์กิจกรรมใหม่
        </h1>
        <div className="flex gap-3">
          <CancelButton
            onClick={() => history.back()}
            className="w-32"
          >
            ย้อนกลับ
          </CancelButton>
          <PrimaryButton onClick={handlePublish} className="w-32">โพสต์</PrimaryButton>
        </div>
      </header>

      {/* GRID หลัก */}
      <div className="grid grid-cols-12 gap-6">
        {/* ซ้าย: แผงควบคุม */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* หมวดหมู่ (แก้จาก text เป็น select แต่ layout เดิม) */}
                <div className="space-y-1">
                    <p className="text-xs text-gray-400">หมวดหมู่</p>
                    <select
                      value={postData.categories}
                      onChange={(e) =>
                        handleCategoryChange(
                          e.target.value as ContentCategoryType
                        )
                      }
                      className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="NEWS">NEWS – ข่าวสาร</option>
                      <option value="EVENT">EVENT – กิจกรรม</option>
                      <option value="ANNOUNCEMENT">
                        ANNOUNCEMENT – ประกาศ
                      </option>
                      <option value="GENERAL">GENERAL – ทั่วไป</option>
                    </select>
                  </div>

                {/* วันที่เผยแพร่ */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">วันที่เผยแพร่</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={postData.date}
                      onChange={(e) =>
                        handleFieldChange('date', e.target.value)
                      }
                      className="text-sm border-b border-gray-300 focus:border-orange-500 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* ลงทะเบียนเข้างาน */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-800">
                      ลงทะเบียนเข้างาน
                    </span>
                    {isBookingConfigured && (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  {/* เลือก Booking = HAVE / NOT */}
                  <div className="flex flex-col gap-1 text-sm mb-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="booking_option"
                        value="NOT"
                        checked={postData.Booking === 'NOT'}
                        onChange={() => handleBookingChange('NOT')}
                        disabled={!!bookingFormId}  // 👈 ถ้ามีฟอร์มแล้ว ไม่ให้เปลี่ยนกลับเป็น NOT
                      />
                      <span className={bookingFormId ? 'text-gray-400 line-through' : ''}>ไม่ต้องลงทะเบียน</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="booking_option"
                        value="HAVE"
                        checked={postData.Booking === 'HAVE'}
                        onChange={() => handleBookingChange('HAVE')}
                      />
                      <span>ต้องลงทะเบียน</span>
                    </label>
                  </div>

                  {/* ปุ่มไปหน้า booking แสดงเฉพาะตอนเลือก HAVE */}
                  {postData.Booking === 'HAVE' && (
                    <Link href="/admin/booking" passHref>
                      <button
                        type="button"
                        className="w-full rounded-full text-sm appearance-none cursor-pointer bg-gray-100 text-gray-700 border border-gray-300"
                        onClick={() => setIsBookingConfigured(true)}
                      >
                        กรอกข้อมูล
                      </button>
                    </Link>
                  )}
                </div>

                {/* เพิ่มลงในโพสต์ของคุณ = รูปหลายรูป */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-2">
                    เพิ่มลงในโพสต์ของคุณ
                  </p>
                  {/* อัปโหลดหลายรูป */}
                  <label
                    htmlFor="extra-upload"
                    className="block w-full h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-orange-400"
                  >
                    <ImageIcon className="w-5 h-5 mb-1" />
                    เพิ่มรูปภาพเพิ่มเติม
                    <input
                      id="extra-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleExtraImagesUpload}
                    />
                  </label>

                  {/* ข้อความเออเร่อถ้ามี */}
                  {errorMsg && (
                    <p className="text-sm text-red-600 mt-2">{errorMsg}</p>
                  )}

                  {/* แสดง thumbnail หลายรูป */}
                  {postData.extraImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {postData.extraImages.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="relative w-full pt-[100%] rounded-md overflow-hidden border border-gray-200 hover:border-orange-400"
                          onClick={() =>
                            setPostData((prev) => ({
                              ...prev,
                              coverImageUrl: src,
                            }))
                          }
                          title="คลิกเพื่อใช้เป็นรูปหลัก"
                        >
                          <Image
                            src={src}
                            alt={`รูปที่ ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ขวา: เนื้อหาโพสต์ */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
          {/* หัวข้อหลัก */}
          <Card>
            <CardContent className="p-6 space-y-2">
              <input
                type="text"
                value={postData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="DSA Mascot Contest"
                className="w-full text-3xl font-semibold p-2 border-b border-gray-200 focus:border-orange-500 outline-none"
              />
            </CardContent>
          </Card>

          {/* รูปหลักในกรอบเทาใหญ่ */}
          <Card>
            <CardContent className="p-6">
              <label
                htmlFor="main-upload"
                className={`block w-full rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden cursor-pointer ${
                  postData.coverImageUrl ? 'p-0' : 'p-8'
                }`}
              >
                {postData.coverImageUrl ? (
                  <div className="relative w-full h-[420px]">
                    <Image
                      src={postData.coverImageUrl}
                      alt="รูปกิจกรรม"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 text-sm">
                    <ImageIcon className="w-6 h-6 mb-2" />
                    ลากและวางรูปภาพ หรือคลิกเพื่ออัปโหลด (รูปหลัก)
                  </div>
                )}
                <input
                  id="main-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                />
              </label>
            </CardContent>
          </Card>

          {/* เนื้อหาข้อความ */}
          <Card>
            <CardContent className="p-6">
              <textarea
                value={postData.body}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                rows={10}
                placeholder="พิมพ์รายละเอียดกิจกรรมของคุณที่นี่…"
                className="w-full text-sm leading-relaxed text-gray-700 p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-200 outline-none resize-y"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EditPostPage() {
  return (
    <Suspense>
      <EditPostPageInner />
    </Suspense>
  );
}