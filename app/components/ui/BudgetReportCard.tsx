"use client";

import { PenLine, Trash2, ChevronDown, RotateCcw } from "lucide-react";
import Image from "next/image";
import { BudgetReport } from "@/app/types/budget_report";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "./Card";
import { useState } from "react";
import ConfirmModal from "@/app/components/ui/ConfirmModal"; 

interface Props {
  report: BudgetReport & { imageSrc?: string }; 
  onDelete?: (id: number) => void;
  onUpdate?: () => void;
  isTrash?: boolean;
}

// ตัวเลือกสถานะ
const STATUS_OPTIONS = [
  { id: 1, label: "ฉบับร่าง", value: "DRAFT", color: "bg-gray-400", textColor: "text-gray-600" },
  { id: 2, label: "รอตรวจสอบ", value: "PENDING_REVIEW", color: "bg-orange-500", textColor: "text-orange-600" },
  { id: 3, label: "อนุมัติ", value: "APPROVED", color: "bg-green-500", textColor: "text-green-600" },
  { id: 4, label: "ส่งกลับไปแก้ไข", value: "NEEDS_REVISION", color: "bg-red-500", textColor: "text-red-600" },
];

export default function BudgetReportCard({ report, onDelete, onUpdate, isTrash = false }: Props) {
  const router = useRouter();
  
  // State
  const [currentStatus, setCurrentStatus] = useState<string>(report.status);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingOption, setPendingOption] = useState<typeof STATUS_OPTIONS[0] | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const activeStatusObj = STATUS_OPTIONS.find(opt => opt.value === currentStatus) || STATUS_OPTIONS[0];
  const displayImage = report.imageSrc || (report.images && report.images.length > 0 ? report.images[0].imagePath : null);

  const canEdit = currentStatus !== "PENDING_REVIEW" && currentStatus !== "APPROVED";

  // --- Handlers ---

  const handleStatusClick = (option: typeof STATUS_OPTIONS[0]) => {
    setPendingOption(option);
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (pendingOption) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/budget-report', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: report.id, status: pendingOption.value })
        });

        if (res.ok) {
            setCurrentStatus(pendingOption.value);
            if (onUpdate) onUpdate();
            else router.refresh();
        } else {
            const data = await res.json();
            alert(`ไม่สามารถอัปเดตสถานะได้: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Update error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setIsLoading(false);
        setIsConfirmOpen(false);
        setPendingOption(null);
      }
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/budget-report?id=${report.id}`, { method: 'DELETE' });
        if(res.ok) {
            if (onDelete) onDelete(report.id);
            if (onUpdate) onUpdate();
            else router.refresh();
        } else {
            const data = await res.json();
            alert(`ลบไม่สำเร็จ: ${data.error}`);
        }
    } catch (e) {
        console.error(e);
        alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
        setIsLoading(false);
        setIsDeleteModalOpen(false);
    }
  };

  // ✅ 3. กู้คืนรายงาน (Restore) -> ปรับให้รีเซ็ตสถานะเป็น DRAFT
  const confirmRestore = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/budget-report/restore', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id })
      });

      if (res.ok) {
        // ✅ อัปเดต State หน้าจอทันทีให้เป็น "ฉบับร่าง" (DRAFT)
        setCurrentStatus("DRAFT");
        
        if (onUpdate) onUpdate();
        else router.refresh();
      } else {
        alert("กู้คืนไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
      setIsRestoreModalOpen(false);
    }
  };

  return (
    <>
      <Card className="
        p-4 border-none shadow-sm bg-white 
        w-full h-full flex flex-col relative transition-all hover:shadow-md
      ">
        {/* --- 1. ส่วนรูปภาพ --- */}
        <div className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden group z-10 bg-gray-100 shrink-0">
          <div className="w-full h-full">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={report.reportTitle || "Project Image"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-100">
                <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
              </div>
            )}
          </div>
          
          {!isTrash && (
            <div className="absolute bottom-2 right-2">
              {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl p-1 border border-gray-100 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right z-50">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick(option);
                      }}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors
                        ${currentStatus === option.value ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-600"}
                      `}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${option.color}`} />
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-full hover:bg-white transition-all ring-1 ring-black/5"
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeStatusObj.color}`} />
                <span className="text-xs font-semibold text-gray-700 truncate max-w-24">
                  {activeStatusObj.label}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
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
          )}
        </div>

        {/* --- 2. เนื้อหา --- */}
        <CardContent className="p-0 mb-6 grow flex flex-col">
          <h3 
            className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight"
            title={report.reportTitle}
          >
            {report.reportTitle}
          </h3>
          <p className="text-gray-500 font-light mt-auto text-sm">
            {isTrash ? "ลบเมื่อ" : "อัปเดตล่าสุดเมื่อ"} : <span className="font-normal">
              {new Date(isTrash ? (report.deletedAt || report.updatedAt) : report.updatedAt).toLocaleDateString("th-TH", {
                year: "2-digit",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </p>
        </CardContent>

        {/* --- 3. ปุ่ม Action --- */}
        <CardFooter className="p-0 flex justify-center gap-2 mt-auto shrink-0">
          {isTrash ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRestoreModalOpen(true);
              }}
              className="bg-orange-500 text-white h-10 rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 text-base font-medium px-8 w-full shadow-sm"
            >
              <RotateCcw className="w-5 h-5" />
              กู้คืน
            </button>
          ) : (
            <>
              {canEdit && (
                <button
                    onClick={() => router.push(`/admin/budget_report/edit/${report.id}`)}
                    className="bg-[#F36618] text-white h-10 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 text-base font-medium px-8 w-30 mr-2"
                >
                    <PenLine className="w-5 h-5" />
                    แก้ไข
                </button>
              )}

              <button
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsDeleteModalOpen(true);
                }}
                className="w-14 h-10 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center shrink-0 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

        </CardFooter>
      </Card>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmChange}
        title="ยืนยันการเปลี่ยนสถานะ"
        message={`คุณต้องการเปลี่ยนสถานะเป็น "${pendingOption?.label}" ใช่หรือไม่?`} 
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        isDanger={false}
        isLoading={isLoading}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบรายงาน"
        message={`คุณต้องการลบรายงาน "${report.reportTitle}" ใช่หรือไม่?`} 
        confirmLabel="ลบรายงาน"
        cancelLabel="ยกเลิก"
        isDanger={true}
        isLoading={isLoading}
      />

      <ConfirmModal 
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={confirmRestore}
        title="ยืนยันการกู้คืน"
        message={`คุณต้องการกู้คืนรายงาน "${report.reportTitle}" กลับมาใช่หรือไม่?`} 
        confirmLabel="กู้คืน"
        cancelLabel="ยกเลิก"
        isDanger={false}
        isLoading={isLoading}
      />
    </>
  );
}