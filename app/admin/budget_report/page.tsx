"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  FileText,
  Hourglass,
  FileX2,
  CirclePlus,
  Search,
  X,
  CheckCircle,
  Plus,
  Loader2,
  Calendar,
  Filter
} from "lucide-react";

// Import Types
import { SummarySubmissionStatus } from "@/app/types/budget_report";
import BudgetReportCard from "@/app/components/ui/BudgetReportCard";
import { Input } from "@/app/components/ui/Input";

// Type Definitions
type FilterLabel = "ทั้งหมด" | "ฉบับร่าง" | "รอตรวจสอบ" | "อนุมัติ" | "ส่งกลับไปแก้ไข";

interface FilterOption {
  label: FilterLabel;
  icon: any;
  key?: SummarySubmissionStatus;
}

const filters: FilterOption[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "ฉบับร่าง", icon: FileText, key: "DRAFT" },
  { label: "รอตรวจสอบ", icon: Hourglass, key: "PENDING_REVIEW" },
  { label: "อนุมัติ", icon: CheckCircle, key: "APPROVED" },
  { label: "ส่งกลับไปแก้ไข", icon: FileX2, key: "NEEDS_REVISION" },
];

// ข้อมูลสำหรับ Dropdown เดือน
const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function BudgetReportPage() {
  const router = useRouter();

  // ================= State =================
  // 1. Data State
  const [reports, setReports] = useState<any[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Filter State (สำหรับหน้าหลัก)
  const [activeFilter, setActiveFilter] = useState<FilterLabel>("ทั้งหมด");
  const [reportSearchTerm, setReportSearchTerm] = useState(""); // ค้นหารายงาน
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // 3. Modal State (สำหรับเลือกโครงการ)
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(""); // ค้นหาโครงการใน Modal

  // ================= Fetch Data =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [resReports, resProjects] = await Promise.all([
        fetch("/api/budget-report"),
        fetch("/api/budget-report/approved-projects")
      ]);

      if (resReports.ok && resProjects.ok) {
        const reportsData = await resReports.json();
        const projectsData = await resProjects.json();

        setReports(reportsData.reports || reportsData || []);
        setApprovedProjects(projectsData.projects || projectsData || []);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= Logic การกรอง (Filtering) =================
  
  // 1. สร้างรายการปีที่มีอยู่ในระบบ (เพื่อเอาไปใส่ Dropdown)
  const availableYears = Array.from(new Set(reports.map(r => new Date(r.createdAt).getFullYear()))).sort((a, b) => b - a);

  // 2. กรอง Reports ตามเงื่อนไขทั้งหมด (Status AND Search AND Year AND Month)
  const filteredReports = reports.filter((report) => {
    // A. Status Filter
    let matchStatus = true;
    if (activeFilter !== "ทั้งหมด") {
      const currentFilterKey = filters.find((f) => f.label === activeFilter)?.key;
      matchStatus = report.status === currentFilterKey;
    }

    // B. Search Filter (Title or Project Name)
    const searchLower = reportSearchTerm.toLowerCase();
    const matchSearch = 
      report.reportTitle?.toLowerCase().includes(searchLower) ||
      report.project?.projectName?.toLowerCase().includes(searchLower);

    // C. Date Filter (Year & Month)
    const createdDate = new Date(report.createdAt);
    
    const matchYear = filterYear === "all" || createdDate.getFullYear().toString() === filterYear;
    // getMonth() returns 0-11, so we add 1 to match value 1-12
    const matchMonth = filterMonth === "all" || (createdDate.getMonth() + 1).toString() === filterMonth;

    return matchStatus && matchSearch && matchYear && matchMonth;
  });

  // 3. กรอง Projects ใน Modal
  const filteredProjectsInModal = approvedProjects.filter((p) =>
    p.projectName.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  // Helper: นับจำนวน Status (นับจากทั้งหมด ไม่สน Filter วันที่ เพื่อให้เห็น Overview)
  const getStatusCount = (filterKey?: SummarySubmissionStatus) => {
    if (!filterKey) return reports.length;
    return reports.filter((r) => r.status === filterKey).length;
  };

  // ================= Handlers =================
  const handleSelectProject = (projectId: number) => {
    router.push(`/admin/budget_report/create?projectId=${projectId}`);
  };

  const handleCreateManual = () => {
    router.push(`/admin/budget_report/create`);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  // ================= Render =================
  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-gray-800">รายงานงบประมาณ</h1>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;
            const count = getStatusCount(filter.key);

            return (
              <div
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`
                  cursor-pointer border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all 
                  ${isActive ? "border-orange-300 shadow-md" : "border-orange-100"}
                `}
              >
                <div className="mb-4 flex justify-center">
                  <Icon
                    className={`w-14 h-14 ${isActive ? "text-orange-500" : "text-orange-300"}`}
                    strokeWidth={1.3}
                  />
                </div>
                <h3 className={`text-base ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                  {filter.label}
                </h3>
                <p className={`text-2xl font-medium mt-2 ${isActive ? "text-orange-600" : "text-gray-400"}`}>
                  {isLoading ? "..." : count}
                </p>
              </div>
            );
          })}
        </div>

        {/* ================= Toolbar (New!) ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          {/* Left Side: Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหารายงาน..."
                value={reportSearchTerm}
                onChange={(e) => setReportSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date Filters Group */}
            <div className="flex gap-2">
              {/* Year Filter */}
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer hover:bg-gray-50 min-w-[100px]"
                >
                  <option value="all">ทุกปี</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year + 543}</option> // แสดงเป็น พ.ศ.
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer hover:bg-gray-50 min-w-[120px]"
                >
                  <option value="all">ทุกเดือน</option>
                  {thaiMonths.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Right Side: Add Button */}
          <button
            onClick={() => setIsSelectModalOpen(true)}
            className="w-full md:w-auto h-10 px-6 rounded-lg bg-orange-500 text-white flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm whitespace-nowrap"
          >
            <CirclePlus className="w-5 h-5" />
            เพิ่มรายงาน
          </button>
        </div>

        {/* Report List */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <BudgetReportCard key={report.id} report={report} onUpdate={fetchData} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
            <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              ไม่พบรายงานตามเงื่อนไขที่กำหนด
            </p>
            <button 
              onClick={() => {
                setReportSearchTerm("");
                setFilterYear("all");
                setFilterMonth("all");
                setActiveFilter("ทั้งหมด");
              }}
                className="text-orange-500 hover:underline mt-2 text-sm"              >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* ================= Modal เลือกโครงการ ================= */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">เลือกโครงการ</h3>
                <p className="text-sm text-gray-500 mt-1">
                  เลือกโครงการที่ <span className="text-green-600 font-medium">อนุมัติแล้ว</span> เพื่อเริ่มทำรายงาน
                </p>
              </div>
              <button
                onClick={() => setIsSelectModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="px-8 pt-6 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="pl-12 bg-gray-50 border-gray-200 focus:bg-white transition-all h-12 rounded-full"
                />
              </div>
            </div>

            {/* Project List in Modal */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3">
              {filteredProjectsInModal.length > 0 ? (
                filteredProjectsInModal.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="group flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer transition-all duration-200 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-orange-700">
                          {project.projectName}
                        </h4>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{project.responsibilityUnit || "ไม่ระบุหน่วยงาน"}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>เริ่ม: {formatDate(project.projectStartDate)}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <CirclePlus className="w-6 h-6 text-gray-400 group-hover:text-white" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  ไม่พบโครงการที่ค้นหา
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center sticky bottom-0 z-10">
              <button
                onClick={handleCreateManual}
                className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-white hover:shadow-sm"
              >
                <Plus className="w-4 h-4" /> หาโครงการไม่เจอ? สร้างรายงานใหม่เอง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}