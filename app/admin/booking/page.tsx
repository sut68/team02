// app/admin/booking-form/new/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { InputIcon } from "../../components/ui/InputIcon";
import { PrimaryButton,CancelButton } from "../../components/ui/Button";
import SuccessModal from "../../components/ui/SuccessModal";

type EventType = "REUNION" | "CAMP" | "SEMINAR" | "WORKSHOP" | "OTHER";
type PriceMode = "SINGLE" | "BY_BATCH" | "FREE";
type Option = "HAVE" | "NOT";

type BatchPriceRow = {
  id: number;
  startBatch: number | "";
  endBatch: number | "";
  price: number | "";
};

export default function BookingFormPage() {
  // ----- state mapping กับ BookingForm -----
  
  const [type, setType] = useState<EventType | "">("REUNION");
  const [batchNumber, setBatchNumber] = useState<number | "">("");
  const [totalSeats, setTotalSeats] = useState<number | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [priceType, setPriceType] = useState<PriceMode>("BY_BATCH");
  const [singlePrice, setSinglePrice] = useState<number | "">("");
  const [souvenir, setSouvenir] = useState<Option | "">("NOT");
  const [batchPrices, setBatchPrices] = useState<BatchPriceRow[]>([
    { id: 1, startBatch: "", endBatch: "", price: "" },
  ]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingFormId, setBookingFormId] = useState<number | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();
  // ----- helper สำหรับ BY_BATCH -----
  const handleBatchChange = (
    id: number,
    field: keyof Omit<BatchPriceRow, "id">,
    value: string
  ) => {
    setBatchPrices((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, [field]: value === "" ? "" : Number(value) }
          : row
      )
    );
  };

  const addBatchRow = () => {
    setBatchPrices((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        startBatch: "",
        endBatch: "",
        price: "",
      },
    ]);
  };

  const removeBatchRow = (id: number) => {
    setBatchPrices((prev) => prev.filter((row) => row.id !== id));
  };

  // ----- submit -----
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload = {
    type: type || null,
    batchNumber: batchNumber === "" ? null : Number(batchNumber),
    totalSeats: totalSeats === "" ? null : Number(totalSeats),
    startDate: startDate || null,
    endDate: endDate || null,
    priceType: priceType,
    singlePrice:
      priceType === "SINGLE" && singlePrice !== ""
        ? Number(singlePrice)
        : null,
    batchPrices:
      priceType === "BY_BATCH"
        ? batchPrices.map((row) => ({
            startBatch: row.startBatch === "" ? null : row.startBatch,
            endBatch: row.endBatch === "" ? null : row.endBatch,
            price: row.price === "" ? null : row.price,
          }))
        : null,
    souvenir: souvenir || null,
  };

  try {
    const res = await fetch("/api/booking-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ Error: " + data.error);
      return;
    }

    setBookingFormId(data.bookingForm.id);
    setShowSuccessModal(true);
    setTimeout(() => {
      router.push(`/admin/news/create?bookingFormId=${data.bookingForm.id}`);
    }, 1500);

  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาด ไม่สามารถบันทึกได้");
  }
};

const handleModalClose = () => {
    setShowSuccessModal(false);
    if (bookingFormId) {
      router.push(`/admin/news/create?bookingFormId=${bookingFormId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] flex items-start justify-center py-10 px-4">
      <SuccessModal
        show={showSuccessModal}
        message="ฟอร์มถูกสร้างแล้ว ไปสร้างโพสต์ต่อได้เลย!"
        onClose={handleModalClose}
      />
      <Card className="w-full max-w-5xl p-8 rounded-3xl">
        <CardHeader className="mb-6 text-2xl font-bold text-gray-900">
          รายละเอียดการลงทะเบียน
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* แถว 1 : ประเภทงาน / จำนวนรุ่นการศึกษา */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Type */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  ประเภทงาน
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType | "")}
                  className="w-full md:w-[260px] h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:border-orange-400"
                >
                  <option value="REUNION">เลี้ยงรุ่น</option>
                  <option value="CAMP">ค่าย</option>
                  <option value="SEMINAR">สัมมนา</option>
                  <option value="WORKSHOP">เวิร์กช็อป</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
              </div>

              {/* BatchNumber */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  จำนวนรุ่นการศึกษา
                </label>
                <Input
                  type="number"
                  value={batchNumber}
                  onChange={(e) =>
                    setBatchNumber(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="เช่น 10 รุ่น"
                  className="w-full md:w-[260px]"
                />
              </div>
            </div>

            {/* แถว 2 : จำนวนที่นั่ง / เว้นช่องขวาให้โล่งเหมือนดีไซน์ */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* TotalSeats */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  จำนวนที่นั่งทั้งหมด
                </label>
                <Input
                  type="number"
                  value={totalSeats}
                  onChange={(e) =>
                    setTotalSeats(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="เช่น 100 ที่นั่ง"
                  className="w-full md:w-[260px]"
                />
              </div>

              {/* ช่องว่างไว้สำหรับ future field */}
              <div />
            </div>

            {/* แถว 3 : วันที่เริ่ม/สิ้นสุดลงทะเบียน */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  วันแรกของการลงทะเบียน
                </label>
                <InputIcon
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-[260px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  วันสิ้นสุดการลงทะเบียน
                </label>
                <InputIcon
                  type="date"
                  value={endDate}
                  min={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-[260px]"
                />
              </div>
            </div>

            {/* แถว 4 : PriceType (3 ปุ่มเรียงแนวนอนเหมือนการ์ด) */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-gray-700">
                กำหนดราคา
              </span>

              <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                {/* SINGLE */}
                <button
                  type="button"
                  onClick={() => setPriceType("SINGLE")}
                  className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    priceType === "SINGLE"
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      priceType === "SINGLE"
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-800">ราคาเดียว</div>
                    <div className="text-xs text-gray-500">
                      ทุกคนจ่ายราคาเท่ากัน
                    </div>
                  </div>
                </button>

                {/* BY_BATCH */}
                <button
                  type="button"
                  onClick={() => setPriceType("BY_BATCH")}
                  className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    priceType === "BY_BATCH"
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      priceType === "BY_BATCH"
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-800">
                      จ่ายตามประเภท / รุ่น
                    </div>
                    <div className="text-xs text-gray-500">
                      เช่น รุ่น 1–10 และ 11–20 แยกราคา
                    </div>
                  </div>
                </button>

                {/* FREE */}
                <button
                  type="button"
                  onClick={() => setPriceType("FREE")}
                  className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    priceType === "FREE"
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      priceType === "FREE"
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-800">ฟรี</div>
                    <div className="text-xs text-gray-500">
                      ไม่มีค่าลงทะเบียน
                    </div>
                  </div>
                </button>
              </div>

              {/* ราคาเดียว กรอกใต้การ์ด */}
              {priceType === "SINGLE" && (
                <div className="mt-3 md:w-[260px]">
                  <label className="mb-1 block text-xs text-gray-600">
                    ราคาต่อคน (บาท)
                  </label>
                  <Input
                    type="number"
                    value={singlePrice}
                    onChange={(e) =>
                      setSinglePrice(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="เช่น 500"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* แถว 5 : ตารางช่วงรุ่น + ราคา (BY_BATCH เท่านั้น) */}
            {priceType === "BY_BATCH" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    รุ่นการศึกษา + ช่วงราคา
                  </span>
                  <button
                    type="button"
                    onClick={addBatchRow}
                    className="text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    + เพิ่มช่วงราคา
                  </button>
                </div>

                <div className="space-y-3">
                  {batchPrices.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-end gap-3 rounded-xl bg-gray-50 px-4 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">เริ่มต้น</span>
                        <Input
                          type="number"
                          value={row.startBatch}
                          onChange={(e) =>
                            handleBatchChange(
                              row.id,
                              "startBatch",
                              e.target.value
                            )
                          }
                          placeholder="เช่น 1"
                          className="w-[90px]"
                          size="sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">สิ้นสุด</span>
                        <Input
                          type="number"
                          value={row.endBatch}
                          onChange={(e) =>
                            handleBatchChange(row.id, "endBatch", e.target.value)
                          }
                          placeholder="เช่น 10"
                          className="w-[90px]"
                          size="sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">ราคา</span>
                        <Input
                          type="number"
                          value={row.price}
                          onChange={(e) =>
                            handleBatchChange(row.id, "price", e.target.value)
                          }
                          placeholder="เช่น 500"
                          className="w-[120px]"
                          size="sm"
                        />
                      </div>

                      {batchPrices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatchRow(row.id)}
                          className="ml-auto text-xs text-gray-500 hover:text-red-500"
                        >
                          ลบช่วงนี้
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* แถว 6 : Souvenir */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  ของที่ระลึก
                </label>
                <select
                  value={souvenir}
                  onChange={(e) => setSouvenir(e.target.value as Option | "")}
                  className="w-full md:w-[260px] h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:border-orange-400"
                >
                  <option value="NOT">ไม่มีของที่ระลึก</option>
                  <option value="HAVE">มีของที่ระลึก</option>
                </select>
              </div>
            </div>

            {/* ปุ่มล่างสุด */}
            <CardFooter className="mt-4 flex justify-end gap-3 p-0">
              <CancelButton
                type="button"
              >
                ยกเลิก
              </CancelButton>
              <PrimaryButton
                type="submit"
              >
                บันทึก
              </PrimaryButton>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}