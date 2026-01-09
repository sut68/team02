"use client";

import React, { useState, useEffect } from "react";
import { X, TriangleAlert } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { PrimaryButton, CancelButton } from "@/app/components/ui/Button";
import { BudgetRound } from "@/app/types/budget_approval";

interface CreateBudgetRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: BudgetRound | null;
}

// Configuration รอบงบประมาณมาตรฐาน
const ROUND_OPTIONS = [
  { id: 1, label: "รอบที่ 1 (ต.ค. - ธ.ค.)", startMonth: 10, endMonth: 12, startDay: 1, endDay: 31, yearOffset: -1 },
  { id: 2, label: "รอบที่ 2 (ม.ค. - มี.ค.)", startMonth: 1, endMonth: 3, startDay: 1, endDay: 31, yearOffset: 0 },
  { id: 3, label: "รอบที่ 3 (เม.ย. - มิ.ย.)", startMonth: 4, endMonth: 6, startDay: 1, endDay: 30, yearOffset: 0 },
  { id: 4, label: "รอบที่ 4 (ก.ค. - ก.ย.)", startMonth: 7, endMonth: 9, startDay: 1, endDay: 30, yearOffset: 0 },
];

export default function CreateBudgetRoundModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CreateBudgetRoundModalProps) {
  
  const currentThaiYear = new Date().getFullYear() + 543;
  
  const [formData, setFormData] = useState({
    fiscalYear: currentThaiYear.toString(),
    selectedRoundId: 1,
    roundName: "",
    // totalBudget: "0", // ❌ ตัดออกจาก State หรือปล่อยไว้ก็ได้ แต่ไม่ได้ใช้ใน UI แล้ว
    startDate: "",
    endDate: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Effect 1: เมื่อ Modal เปิด หรือ initialData เปลี่ยน ให้ Set ค่าลง Form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // --- กรณีแก้ไข ---
        let matchedRoundId = 0; // 0 = Custom

        // Regex ดึงเลขรอบ
        const match = initialData.roundName.match(/รอบ.*ที่\s*(\d+)/);
        
        if (match && match[1]) {
           const roundNum = parseInt(match[1]);
           if ([1, 2, 3, 4].includes(roundNum)) {
             matchedRoundId = roundNum;
           }
        }

        setFormData({
          fiscalYear: initialData.fiscalYear || currentThaiYear.toString(),
          selectedRoundId: matchedRoundId,
          roundName: initialData.roundName || "",
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
        });
      } else {
        // --- กรณีสร้างใหม่ ---
        setFormData({
          fiscalYear: currentThaiYear.toString(),
          selectedRoundId: 1, 
          roundName: "", 
          startDate: "",
          endDate: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, currentThaiYear]);


  // ✅ Effect 2: Auto Gen (ทำงานเฉพาะตอนสร้างใหม่ หรือเมื่อเลือก Dropdown)
  useEffect(() => {
    if (initialData && formData.selectedRoundId === 0) return;
    if (formData.selectedRoundId === 0) return;
    if (!formData.fiscalYear || formData.fiscalYear.length !== 4) return;

    const budgetYearCE = parseInt(formData.fiscalYear) - 543;
    const roundConfig = ROUND_OPTIONS.find(r => r.id === Number(formData.selectedRoundId));

    if (roundConfig) {
      const autoName = `รอบการพิจารณาที่ ${roundConfig.id} ประจำปีงบประมาณ ${formData.fiscalYear}`;
      
      const startYear = budgetYearCE + roundConfig.yearOffset;
      let endYear = startYear;
      if (roundConfig.endMonth < roundConfig.startMonth) endYear = startYear + 1;

      const strStart = `${startYear}-${String(roundConfig.startMonth).padStart(2, '0')}-${String(roundConfig.startDay).padStart(2, '0')}`;
      const strEnd = `${endYear}-${String(roundConfig.endMonth).padStart(2, '0')}-${String(roundConfig.endDay).padStart(2, '0')}`;

      setFormData(prev => ({
        ...prev,
        roundName: autoName,
        startDate: strStart,
        endDate: strEnd
      }));
    }
  }, [formData.fiscalYear, formData.selectedRoundId, initialData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roundName.trim()) newErrors.roundName = "กรุณาระบุชื่อรอบ";
    if (!formData.fiscalYear.trim() || formData.fiscalYear.length !== 4) newErrors.fiscalYear = "ปีงบประมาณไม่ถูกต้อง";
    if (!formData.startDate) newErrors.startDate = "ระบุวันเริ่มต้น";
    if (!formData.endDate) newErrors.endDate = "ระบุวันสิ้นสุด";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        totalBudget: 0, // ส่ง 0 ไปเสมอ เพราะระบบคำนวณจาก Donation เอง
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      const method = initialData ? "PUT" : "POST";
      const body = initialData ? { ...payload, id: initialData.id } : payload;

      const res = await fetch("/api/budget-round", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
                {isEditMode ? "แก้ไขรอบงบประมาณ" : "เปิดรอบการพิจารณาใหม่"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">กำหนด 3 รอบต่อปีงบประมาณ</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ปีงบประมาณ (พ.ศ.) <span className="text-red-500">*</span>
                </label>
                <Input
                  name="fiscalYear"
                  type="number"
                  value={formData.fiscalYear}
                  onChange={handleChange}
                  placeholder="2568"
                  radius="md"
                  className={errors.fiscalYear ? "border-red-500" : ""}
                  // ล็อกปีงบประมาณถ้าแก้ไข
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกรอบ <span className="text-red-500">*</span>
                </label>
                <select
                  name="selectedRoundId"
                  value={formData.selectedRoundId}
                  onChange={handleChange}
                  // ล็อกรอบถ้าแก้ไข (เว้นแต่เป็น Custom)
                  // disabled={isEditMode} // ✅ เปิดให้เลือกได้ตลอด เพื่อดูว่าเป็นรอบไหน
                  className="w-full h-[42px] px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F26522] text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {/* แสดง option 'กำหนดเอง' */}
                  <option value={0}>กำหนดเอง (กรอกวันที่เอง)</option>
                  
                  {ROUND_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อรอบ/โครงการ <span className="text-red-500">*</span>
              </label>
              <Input
                name="roundName"
                value={formData.roundName}
                onChange={handleChange}
                placeholder="ระบบจะสร้างชื่อให้..."
                radius="md"
                className={`bg-gray-50 ${errors.roundName ? "border-red-500" : ""}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันเปิดรับ <span className="text-red-500">*</span></label>
                <Input 
                    type="date" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    radius="md"
                    className={errors.startDate ? "border-red-500" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันปิดรับ <span className="text-red-500">*</span></label>
                <Input 
                    type="date" 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={handleChange}
                    radius="md"
                    className={errors.endDate ? "border-red-500" : ""}
                />
              </div>
            </div>

            {isEditMode && (
                <div className="text-[11px] text-gray-400 bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-orange-700">ข้อควรระวัง: </span>
                    ปีงบประมาณไม่สามารถแก้ไขได้ หากต้องการเปลี่ยนแปลงกรุณาสร้างรอบใหม่
                  </p>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                <CancelButton onClick={onClose} type="button" disabled={isSubmitting} style={{ borderRadius: "8px", height: "38px" }}>
                    ยกเลิก
                </CancelButton>
                <PrimaryButton type="submit" disabled={isSubmitting} style={{ borderRadius: "8px", height: "38px" }}>
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </PrimaryButton>
            </div>
        </form>

      </div>
    </div>
  );
}