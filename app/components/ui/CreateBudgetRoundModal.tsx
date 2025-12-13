"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { PrimaryButton, CancelButton } from "@/app/components/ui/Button";

interface CreateBudgetRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateBudgetRoundModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBudgetRoundModalProps) {
  // --- State ---
  const [formData, setFormData] = useState({
    roundName: "",
    fiscalYear: new Date().getFullYear() + 543 + "", // Default ปีไทยปัจจุบัน
    // ❌ ตัด totalBudget ออก
    startDate: "",
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roundName.trim()) newErrors.roundName = "กรุณาระบุชื่อรอบ";
    if (!formData.fiscalYear.trim()) newErrors.fiscalYear = "กรุณาระบุปีงบประมาณ";
    // ❌ ตัด Validation วงเงินออก
    
    if (!formData.startDate) newErrors.startDate = "ระบุวันเริ่มต้น";
    if (!formData.endDate) newErrors.endDate = "ระบุวันสิ้นสุด";
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // เตรียม Payload
      const payload = {
        ...formData,
        totalBudget: 0, // ✅ ส่ง 0 ไปเป็นค่าเริ่มต้น เพราะเป็นการระดมทุน
      };

      const res = await fetch("/api/budget-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "สร้างรอบงบประมาณไม่สำเร็จ");
      }

      alert("สร้างรอบงบประมาณเรียบร้อยแล้ว");
      onSuccess?.();
      onClose();
      
      // Reset Form
      setFormData({
        roundName: "",
        fiscalYear: new Date().getFullYear() + 543 + "",
        startDate: "",
        endDate: "",
      });

    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-semibold text-gray-700">เปิดรอบงบประมาณใหม่</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* ชื่อรอบ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อรอบ/โครงการ <span className="text-red-500">*</span>
            </label>
            <Input
              name="roundName"
              value={formData.roundName}
              onChange={handleChange}
              placeholder="เช่น รอบไตรมาสที่ 1 ประจำปี 2568"
              radius="md"
              className={errors.roundName ? "border-red-500" : ""}
            />
            {errors.roundName && <p className="text-red-500 text-xs mt-1">{errors.roundName}</p>}
          </div>

          {/* ปีงบประมาณ (เต็มแถว) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ปีงบประมาณ <span className="text-red-500">*</span>
            </label>
            <Input
              name="fiscalYear"
              value={formData.fiscalYear}
              onChange={handleChange}
              placeholder="2568"
              radius="md"
              className={errors.fiscalYear ? "border-red-500" : ""}
            />
            {errors.fiscalYear && <p className="text-red-500 text-xs mt-1">{errors.fiscalYear}</p>}
          </div>

          {/* วันที่เริ่ม - สิ้นสุด */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันเปิดรับ <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                radius="md"
                className={`cursor-pointer ${errors.startDate ? "border-red-500" : ""}`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันปิดรับ <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                radius="md"
                min={formData.startDate}
                className={`cursor-pointer ${errors.endDate ? "border-red-500" : ""}`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <CancelButton onClick={onClose} type="button" style={{ borderRadius: "8px", height: "38px" }}>
            ยกเลิก
          </CancelButton>
          <PrimaryButton 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ borderRadius: "8px", height: "38px" }}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </PrimaryButton>
        </div>

      </div>
    </div>
  );
}