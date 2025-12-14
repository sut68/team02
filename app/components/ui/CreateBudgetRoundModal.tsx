"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { PrimaryButton, CancelButton } from "@/app/components/ui/Button";

interface BudgetRoundData {
  id?: number;
  roundName: string;
  fiscalYear: string;
  startDate: string;
  endDate: string;
  status?: string;
}

interface CreateBudgetRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: BudgetRoundData | null; // ✅ เพิ่ม Prop นี้รับข้อมูลที่จะแก้ไข
}

// Option รอบเหมือนเดิม
const ROUND_OPTIONS = [
  { id: 1, label: "รอบที่ 1 (ต.ค. - ม.ค.)", startMonth: 10, endMonth: 1, startDay: 1, endDay: 31, yearOffset: -1 },
  { id: 2, label: "รอบที่ 2 (ก.พ. - พ.ค.)", startMonth: 2, endMonth: 5, startDay: 1, endDay: 31, yearOffset: 0 },
  { id: 3, label: "รอบที่ 3 (มิ.ย. - ก.ย.)", startMonth: 6, endMonth: 9, startDay: 1, endDay: 30, yearOffset: 0 },
];

export default function CreateBudgetRoundModal({
  isOpen,
  onClose,
  onSuccess,
  editData, // ✅ รับค่ามา
}: CreateBudgetRoundModalProps) {
  
  const currentThaiYear = new Date().getFullYear() + 543;
  
  const [formData, setFormData] = useState({
    fiscalYear: currentThaiYear.toString(),
    selectedRoundId: 1,
    roundName: "",
    startDate: "",
    endDate: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Effect 1: เมื่อ Modal เปิด หรือ editData เปลี่ยน ให้ Set ค่าลง Form
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // กรณีแก้ไข: เอาข้อมูลเดิมมาใส่
        // พยายามแกะรอบจากชื่อ (ถ้าทำได้) หรือใส่ค่าดิบไปเลย
        setFormData({
            fiscalYear: editData.fiscalYear,
            selectedRoundId: 0, // 0 = Custom/Manual (ไม่เข้าเงื่อนไข Auto-gen)
            roundName: editData.roundName,
            startDate: editData.startDate ? new Date(editData.startDate).toISOString().split('T')[0] : "",
            endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : "",
        });
      } else {
        // กรณีสร้างใหม่: Reset ค่าเป็น Default
        setFormData({
            fiscalYear: currentThaiYear.toString(),
            selectedRoundId: 1,
            roundName: "", // จะถูก Auto-gen ใน Effect ถัดไป
            startDate: "",
            endDate: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editData, currentThaiYear]);


  // ✅ Effect 2: Auto Gen (ทำงานเฉพาะตอนสร้างใหม่ หรือเมื่อเลือก Dropdown)
  useEffect(() => {
    // ถ้ากำลังแก้ไข (editData มีค่า) และ User ไม่ได้ไปกดเปลี่ยน Dropdown -> ไม่ต้อง Auto Gen ทับ
    if (editData && formData.selectedRoundId === 0) return;

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
  }, [formData.fiscalYear, formData.selectedRoundId, editData]);


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

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        totalBudget: 0,
        // ถ้าแก้ไข ส่ง id ไปด้วย (แต่ปกติ PUT ใช้ id จาก query/url หรือ body ก็ได้ตาม API)
        id: editData?.id 
      };

      // ✅ เลือก Method และ URL ตามโหมด
      const method = editData ? "PUT" : "POST";
      const url = "/api/budget-round";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      // alert(editData ? "แก้ไขเรียบร้อย" : "สร้างเรียบร้อย"); // ตัด Alert ออกเพื่อให้ UX ลื่นขึ้น หรือจะใส่ Success Modal แทน
      onSuccess?.();
      onClose();

    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  const isEditMode = !!editData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
                {isEditMode ? "แก้ไขรอบงบประมาณ" : "เปิดรอบงบประมาณใหม่"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">กำหนด 3 รอบต่อปีงบประมาณ</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
            {/* ... (ส่วน Input เหมือนเดิม) ... */}
            
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
                className="w-full h-[42px] px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F26522] text-sm"
              >
                {/* เพิ่ม Option พิเศษสำหรับตอนแก้ไขแบบ Custom */}
                {isEditMode && formData.selectedRoundId === 0 && (
                   <option value={0}>กำหนดเอง (Custom)</option>
                )}
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
              ชื่อรอบ/โครงการ
            </label>
            <Input
              name="roundName"
              value={formData.roundName}
              onChange={handleChange}
              placeholder="ระบบจะสร้างชื่อให้..."
              radius="md"
              className={errors.roundName ? "border-red-500" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันเปิดรับ</label>
              <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} radius="md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันปิดรับ</label>
              <Input type="date" name="endDate" value={formData.endDate} onChange={handleChange} radius="md" />
            </div>
          </div>

        </div>

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