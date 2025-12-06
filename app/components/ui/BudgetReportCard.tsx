"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PenLine, Trash2, ChevronDown, AlertCircle } from "lucide-react";
import { BudgetReport, ReportStatus } from "@/app/types/budget_report";
import { Card, CardContent, CardFooter } from "./Card";

interface Props {
  report: BudgetReport;
  onDelete?: (id: number) => void;
}

// กำหนดตัวเลือกสถานะ (อิงตาม ReportStatus)
const STATUS_OPTIONS: { label: ReportStatus; color: string; textColor: string }[] = [
  { label: "ฉบับร่าง", color: "bg-gray-400", textColor: "text-gray-600" },
  { label: "รอตรวจสอบ", color: "bg-orange-500", textColor: "text-orange-600" },
  { label: "อนุมัติ", color: "bg-green-500", textColor: "text-green-600" },
  { label: "ส่งกลับไปแก้ไข", color: "bg-red-500", textColor: "text-red-600" },
];

export default function BudgetReportCard({ report, onDelete }: Props) {
  const router = useRouter();
  
  // --- State Management ---
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
      console.log(`Confirmed change status of ID ${report.id} to: ${pendingStatus}`);
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
      <Card className="p-4 rounded-4xl border-none shadow-sm bg-white w-full h-auto flex flex-col relative group transition-all duration-300 hover:shadow-md">
        
        {/* --- 1. ส่วนรูปภาพ (เหมือนตัวอย่าง ProjectCard) --- */}
        <div className="relative w-full aspect-video mb-4 rounded-2xl group z-10">
          <div className="w-full h-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
            {report.imageSrc ? (
              <Image
                src={report.imageSrc}
                alt={report.projectName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
              </div>
            )}
          </div>
          
          {/* Layer Dropdown Status (มุมขวาล่างของรูป) */}
          <div className="absolute bottom-2 right-2">
            
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
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors text-left
                      ${currentStatus === option.label ? "bg-gray-50 text-gray-900" : "hover:bg-gray-50 text-gray-600"}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${option.color}`} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ปุ่มกดเปิด Dropdown */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md shadow-sm rounded-full hover:bg-white transition-all ring-1 ring-black/5"
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeStatusObj.color}`} />
              <span className="text-xs font-semibold text-gray-700 truncate max-w-20">
                {activeStatusObj.label}
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>
            
            {/* Backdrop ปิด Menu */}
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

        {/* --- 2. เนื้อหา (ชื่อรายงาน + วันที่อัปเดต) --- */}
        <CardContent className="p-0 mb-6 grow">
          <h3 className="text-gray-900 font-bold text-lg leading-snug line-clamp-2 mb-1">
            {report.projectName}
          </h3>
          <p className="text-gray-500 font-light text-sm">
            อัปเดตเมื่อ : <span className="font-normal">{report.updatedAt}</span>
          </p>
        </CardContent>

        {/* --- 3. ปุ่ม Action (Footer) --- */}
        <CardFooter className="p-0 flex justify-center gap-0 mt-auto">
          
          {/* ปุ่มแก้ไข (ใช้สไตล์เดียวกับ ProjectCard) */}
          <button
            onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/budget_report/edit/${report.id}`);
            }}
            className="bg-[#F26522] hover:bg-[#d9531e] text-white h-10 rounded-full px-6 flex items-center justify-center gap-2 text-base font-medium transition-transform active:scale-95 flex-1 max-w-[140px]"
          >
            <PenLine className="w-4 h-4" />
            <span>แก้ไข</span>
          </button>

          {/* ปุ่มลบ */}
          <button
            onClick={(e) => { 
                e.stopPropagation(); 
                onDelete && onDelete(report.id); 
            }}
            className="w-14 h-10 ml-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition flex items-center justify-center shrink-0 active:scale-95 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </CardFooter>
      </Card>

      {/* --- Confirmation Modal --- */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            
            <div className="flex flex-col items-center text-center gap-4">
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