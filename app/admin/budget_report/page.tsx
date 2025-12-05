"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Layers, 
  FileText, 
  Hourglass, 
  CheckCircle2, 
  FileX2,
  CirclePlus
} from "lucide-react";
import { BudgetReport, ReportStatus } from "@/app/types/budget_report";
import BudgetReportCard from "@/app/components/ui/BudgetReportCard";

// --- Mock Data ---
const mockReports: BudgetReport[] = [
  {
    id: 1,
    projectName: "รายงานงบประมาณโครงการทุนการศึกษา ภาค 1/2568",
    status: "ฉบับร่าง",
    updatedAt: "2025-01-20",
    imageSrc: "" 
  },
  {
    id: 2,
    projectName: "รายงานสรุปผลโครงการพัฒนาทักษะวิชาชีพวิศวกรรม",
    status: "รอตรวจสอบ",
    updatedAt: "2025-01-21",
    imageSrc: "/Content/Event5.jpg"
  },
  {
    id: 3,
    projectName: "รายงานค่าใช้จ่ายกิจกรรมรับน้อง 2568",
    status: "อนุมัติ",
    updatedAt: "2025-01-22",
    imageSrc: "/Content/Event1.jpg"
  },
  {
    id: 4,
    projectName: "โครงการอบรมเชิงปฏิบัติการ IoT",
    status: "ส่งกลับไปแก้ไข",
    updatedAt: "2025-01-23",
    imageSrc: "/Content/Event3.png"
  },
];

// Configuration Filter Icons
const filters: { label: ReportStatus | 'ทั้งหมด'; icon: any }[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "ฉบับร่าง", icon: FileText },
  { label: "รอตรวจสอบ", icon: Hourglass },
  { label: "อนุมัติ", icon: CheckCircle2 },
  { label: "ส่งกลับไปแก้ไข", icon: FileX2 },
];

export default function BudgetReportPage() {
  const [activeFilter, setActiveFilter] = useState<string>("ทั้งหมด");
  const [reports, setReports] = useState<BudgetReport[]>(mockReports);

  // Filter Logic
  const filteredReports = reports.filter((report) => 
    activeFilter === "ทั้งหมด" ? true : report.status === activeFilter
  );

  const handleDelete = (id: number) => {
    if(confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* 1. Filter Section (Rounded Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;
            const count = filter.label === "ทั้งหมด" 
              ? reports.length 
              : reports.filter(r => r.status === filter.label).length;
            
            return (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`
                  flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 group
                  ${isActive 
                    ? "bg-white border-[#F26522]/30 shadow-[0_8px_20px_rgba(242,101,34,0.1)] scale-100" 
                    : "bg-white border-transparent hover:border-gray-100 hover:shadow-md scale-95 opacity-80 hover:opacity-100"
                  }
                `}
              >
                <div className={`mb-2 p-3 rounded-full ${isActive ? 'bg-orange-50' : 'bg-gray-50 group-hover:bg-orange-50/50'}`}>
                  <Icon 
                    strokeWidth={isActive ? 2 : 1.5} 
                    className={`w-6 h-6 md:w-8 md:h-8 ${isActive ? "text-[#F26522]" : "text-gray-400 group-hover:text-orange-300"}`} 
                  />
                </div>
                <span className={`text-sm font-semibold mb-1 ${isActive ? "text-gray-800" : "text-gray-500"}`}>
                  {filter.label}
                </span>
                 <span className={`text-xs ${isActive ? "text-orange-600 font-bold" : "text-gray-400"}`}>
                  {count} รายการ
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Header & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            รายงานงบประมาณ
          </h2>
          
          <Link
            href="/admin/budget_report/create"
            className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#d9531e] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5"
          >
            <CirclePlus className="w-5 h-5" />
            <span className="font-semibold">เพิ่มรายงาน</span>
          </Link>
        </div>

        {/* 3. Report Cards Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReports.map((report) => (
              <BudgetReportCard 
                key={report.id} 
                report={report} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-4xl bg-gray-50/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <Layers className="w-10 h-10" />
            </div>
            <p className="text-gray-400 text-lg font-medium">ไม่พบรายงานในสถานะ "{activeFilter}"</p>
          </div>
        )}

      </div>
    </main>
  );
}