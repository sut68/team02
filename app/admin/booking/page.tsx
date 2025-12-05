// app/admin/booking/page.tsx
"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { Input } from "../../components/ui/Input";
import { InputIcon } from "../../components/ui/InputIcon";
import { Textarea } from "../../components/ui/InputTextArea";

type PriceMode = "single" | "byBatch" | "free";

export default function BookingFormPage() {
  const [priceMode, setPriceMode] = React.useState<PriceMode>("byBatch");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit form");
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] flex items-start justify-center py-10 px-4">
      <Card className="w-full max-w-5xl p-8 rounded-3xl">
        <CardHeader className="mb-6 text-2xl font-semibold text-gray-900">
          รายละเอียดการลงทะเบียน
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* แถวที่ 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* ประเภทงาน */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">ประเภทงาน</label>
              <div className="relative">
                {/* ตัวอย่างกำหนดกว้าง 200px */}
                <select className="w-full md:w-[260px] h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:border-orange-400">
                  <option value="">เลือกประเภทงาน</option>
                  <option value="reunion">เลี้ยงรุ่น</option>
                  <option value="camp">ค่าย</option>
                  <option value="seminar">สัมมนา</option>
                </select>
              </div>
            </div>

            {/* จำนวนรุ่นการศึกษา */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                จำนวนรุ่นการศึกษา
              </label>
              {/* ตัวอย่างใช้ Input + w-full / w-1/2 */}
              <Input
                placeholder="เช่น 10 รุ่น"
                className="w-full md:w-[260px]"
                size="md"
              />
            </div>
          </div>

          {/* แถวที่ 2 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* จำนวนที่นั่ง */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                จำนวนที่นั่ง
              </label>
              <Input
                placeholder="เช่น 100 ที่นั่ง"
                className="w-full md:w-[260px]"
              />
            </div>

            {/* ช่องว่าง/ฟิลด์อื่นเพิ่มได้ */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                หมายเหตุ (ถ้ามี)
              </label>
              <Input
                placeholder="ใส่ข้อความสั้นๆ"
                className="w-full md:w-[260px]"
              />
            </div>
          </div>

          {/* แถวที่ 3 - วันเปิด/ปิดรับสมัคร */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                วันแรกของการลงทะเบียน
              </label>
              <InputIcon
                type="date"
                icon={Calendar}
                iconPosition="right"
                className="w-full md:w-[260px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                วันสิ้นสุดการลงทะเบียน
              </label>
              <InputIcon
                type="date"
                icon={Calendar}
                iconPosition="right"
                className="w-full md:w-[260px]"
              />
            </div>
          </div>

          {/* แถวที่ 4 - โหมดราคา */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-700">กำหนดราคา</span>

            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
              {/* ราคาเดียว */}
              <button
                type="button"
                onClick={() => setPriceMode("single")}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  priceMode === "single"
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border ${
                    priceMode === "single"
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300 bg-white"
                  }`}
                />
                <div>
                  <div className="font-medium text-gray-800">ราคาเดียว</div>
                  <div className="text-xs text-gray-500">
                    ทุกคนจ่ายราคาเดียวกัน
                  </div>
                </div>
              </button>

              {/* จ่ายตามประเภท */}
              <button
                type="button"
                onClick={() => setPriceMode("byBatch")}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  priceMode === "byBatch"
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border ${
                    priceMode === "byBatch"
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300 bg-white"
                  }`}
                />
                <div>
                  <div className="font-medium text-gray-800">
                    จ่ายตามประเภท
                  </div>
                  <div className="text-xs text-gray-500">
                    เช่น รุ่น 4–10, 11–20 กำหนดราคาแต่ละช่วง
                  </div>
                </div>
              </button>

              {/* ฟรี */}
              <button
                type="button"
                onClick={() => setPriceMode("free")}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  priceMode === "free"
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border ${
                    priceMode === "free"
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300 bg-white"
                  }`}
                />
                <div>
                  <div className="font-medium text-gray-800">ฟรี</div>
                  <div className="text-xs text-gray-500">
                    ไม่มีค่าใช้จ่าย
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* แถวที่ 5 - ช่วงรุ่น + ราคา (โชว์เฉพาะตอนเลือกจ่ายตามประเภท) */}
          {priceMode === "byBatch" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  รุ่นการศึกษา
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-orange-500 hover:text-orange-600"
                >
                  + เพิ่มช่วงราคา
                </button>
              </div>

              {/* ตัวอย่าง 1 แถว: เริ่มต้น / สิ้นสุด / ราคา */}
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">เริ่มต้น</span>
                  {/* ตัวอย่างใช้ w-[120px] */}
                  <Input
                    placeholder="เช่น 1"
                    className="w-[120px]"
                    size="sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">สิ้นสุด</span>
                  <Input
                    placeholder="เช่น 10"
                    className="w-[120px]"
                    size="sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">ราคา</span>
                  {/* ตัวอย่างกำหนดกว้างตามเนื้อหา (w-auto) บวก padding */}
                  <Input
                    placeholder="เช่น 500 บาท"
                    className="w-auto min-w-[160px]"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ตัวเลือกเสริม */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                ตัวเลือกเสริม
              </label>
              <select className="w-full md:w-[260px] h-11 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:border-orange-400">
                <option value="">ของที่ระลึก</option>
                <option value="have">มีของที่ระลึก</option>
                <option value="none">ไม่มีของที่ระลึก</option>
              </select>
            </div>

            {/* ช่องอธิบายเสริม */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                รายละเอียดเพิ่มเติม
              </label>
              <Textarea
                placeholder="ใส่รายละเอียดเพิ่มเติมของการลงทะเบียน"
                className="w-full h-20 text-sm"
              />
            </div>
          </div>

          <CardFooter className="mt-4 flex justify-end gap-3 p-0">
            <button
              type="button"
              className="h-11 rounded-full border border-gray-300 bg-white px-8 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="h-11 rounded-full bg-[#F36618] px-10 text-sm font-medium text-white hover:bg-orange-600 shadow-sm"
            >
              บันทึก
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
