"use client";

import { PenLine, Trash2, ChevronDown, AlertCircle } from "lucide-react";
import Image from "next/image";
import { BudgetReport, ReportStatus } from "@/app/types/budget_report";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "./Card"; // Import sub-components
import { useState } from "react";

interface Props {
  report: BudgetReport;
  onDelete?: (id: number) => void;
}

// กำหนดตัวเลือกสถานะ (ใช้ Label เป็น Key หลักเพราะ Type เป็น String)
const STATUS_OPTIONS: { label: ReportStatus; color: string; textColor: string }[] = [
  { label: "ฉบับร่าง", color: "bg-gray-400", textColor: "text-gray-600" },
  { label: "รอตรวจสอบ", color: "bg-orange-500", textColor: "text-orange-600" },
  { label: "อนุมัติ", color: "bg-green-500", textColor: "text-green-600" },
  { label: "ส่งกลับไปแก้ไข", color: "bg-red-500", textColor: "text-red-600" },
];

export default function BudgetReportCard({ report, onDelete }: Props) {
  const router = useRouter();
  
  // --- State Management (เหมือน ProjectCard) ---
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>(report.status);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(null);

  // หา Object สถานะปัจจุบันและที่กำลังเลือก
  const activeStatusObj = STATUS_OPTIONS.find((s) => s.label === currentStatus) || STATUS_OPTIONS[0];
  const pendingStatusObj = STATUS_OPTIONS.find((s) => s.label === pendingStatus);

  // 1. กดเลือกใน Dropdown
  const handleStatusClick = (statusLabel: ReportStatus) => {
    setPendingStatus(statusLabel);
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  };

  // 2. กดยืนยันใน Modal
  const confirmChange = () => {
    if (pendingStatus) {
      setCurrentStatus(pendingStatus);
      // TODO: ใส่ Logic เรียก API อัปเดตสถานะตรงนี้
      console.log(`Updated status to: ${pendingStatus}`);
    }
    setIsConfirmOpen(false);
    setPendingStatus(null);
  };

  // 3. กดยกเลิก
  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Card className="rounded-[32px] p-5 hover:shadow-lg border border-gray-50 flex flex-col h-full relative group transition-all duration-300">
        
        {/* 1. ส่วนรูปภาพ - วางไว้ใน Card body หลัก (หรือจะใส่ CardHeader ก็ได้ แต่ดีไซน์นี้รูปเด่นกว่า) */}
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-gray-50 border border-gray-100 z-10">
          {report.imageSrc ? (
            <Image
              src={report.imageSrc}
              alt={report.projectName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50/50">
              <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
            </div>
          )}
          
          {/* --- Dropdown Selector (มุมขวาล่างของรูป) --- */}
          <div className="absolute bottom-3 right-3">
            
            {/* Menu List */}
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl p-1 border border-gray-100 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right z-50">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusClick(option.label);
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors
                      ${currentStatus === option.label ? "bg-gray-50 text-gray-900" : "hover:bg-gray-50 text-gray-600"}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${option.color}`} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ปุ่มกดเปิด Dropdown (แสดงสถานะปัจจุบัน) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md shadow-sm rounded-full hover:bg-white transition-all ring-1 ring-black/5"
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activeStatusObj.color}`} />
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">
                {activeStatusObj.label}
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>
            
            {/* Backdrop สำหรับปิด Menu เมื่อคลิกข้างนอก */}
            {isMenuOpen && (
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }} 
              />
            )}
          </div>
        </div>

        {/* 2. เนื้อหา (ชื่อโครงการ) - ใช้ CardContent */}
        <CardContent className="p-0 flex-grow flex flex-col items-center text-center mb-6">
          <h3 className="text-gray-900 font-medium text-lg leading-snug line-clamp-2">
            {report.projectName}
          </h3>
        </CardContent>

        {/* 3. ปุ่ม Action - ใช้ CardFooter */}
        {/* Override default styles of CardFooter to center items */}
        <CardFooter className="p-0 mt-auto w-full flex justify-center gap-3 space-x-0">
          {/* ปุ่มแก้ไข */}
          <button
            onClick={() => router.push(`/admin/budget_report/edit/${report.id}`)}
            className="bg-[#F26522] hover:bg-[#d9531e] text-white h-10 rounded-full px-6 flex items-center justify-center gap-2 text-sm font-medium transition-transform active:scale-95 flex-1 max-w-[120px]"
          >
            <PenLine className="w-4 h-4" />
            <span>แก้ไข</span>
          </button>

          {/* ปุ่มลบ */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(report.id); }}
            className="bg-[#5F6368] hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </CardFooter>
      </Card>

      {/* --- Confirmation Modal (เหมือน ProjectCard เป๊ะๆ) --- */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            
            <div className="flex flex-col items-center text-center gap-4">
              {/* Icon เตือน */}
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการเปลี่ยนสถานะ</h3>
                <p className="text-sm text-gray-500 mt-2">
                  คุณต้องการเปลี่ยนสถานะเป็น <br/>
                  <span className={`font-bold ${pendingStatusObj?.textColor} bg-gray-50 px-2 py-0.5 rounded mt-1 inline-block`}>
                    "{pendingStatusObj?.label}"
                  </span> ใช่หรือไม่?
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={cancelChange}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmChange}
                  className="flex-1 py-2.5 rounded-full bg-[#F26522] text-white font-medium hover:bg-orange-700 transition shadow-md shadow-orange-200"
                >
                  ยืนยัน
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}