"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  History,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { SummarySubmissionStatus } from "@/app/types/budget_report";
import BudgetReportCard from "@/app/components/ui/BudgetReportCard";
import { Input } from "@/app/components/ui/Input";
import { BudgetRound } from "@/app/types/budget_approval";

// Type Definitions
type FilterLabel = "ทั้งหมด" | "ฉบับร่าง" | "รอตรวจสอบ" | "อนุมัติ" | "ส่งกลับไปแก้ไข" | "ถังขยะ";

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

export default function BudgetReportPage() {
  const router = useRouter();

  // State
  const [reports, setReports] = useState<any[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<FilterLabel>("ทั้งหมด");
  const [reportSearchTerm, setReportSearchTerm] = useState(""); 
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Collapse State
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  // Modal State
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(""); 

  // State สำหรับเก็บรอบงบประมาณ
  const [budgetRounds, setBudgetRounds] = useState<BudgetRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("all");
  
  // State สำหรับเก็บข้อมูลการเงิน
  const [financialStats, setFinancialStats] = useState({ income: 0, expense: 0, balance: 0 });

  // 1. Fetch Rounds ตอนเข้าหน้าเว็บ
  useEffect(() => {
    const fetchRounds = async () => {
        try {
            const res = await fetch("/api/budget-round");
            if (res.ok) {
                const data = await res.json();
                setBudgetRounds(data.budgetRounds || []);
            }
        } catch (error) {
            console.error("Failed to fetch budget rounds", error);
        }
    };
    fetchRounds();
  }, []);

  // ================= Fetch Data =================
  const fetchData = useCallback(async (isTrashMode: boolean = false) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (isTrashMode) params.append("trash", "true");
      if (filterYear !== "all") params.append("year", filterYear);
      if (selectedRoundId !== "all") params.append("roundId", selectedRoundId);

      const resReports = await fetch(`/api/budget-report?${params.toString()}`);
      
      const financeParams = new URLSearchParams();
      if (selectedRoundId !== "all") {
         financeParams.append("roundId", selectedRoundId);
      } else if (filterYear !== "all") {
         financeParams.append("fiscalYear", filterYear);
      }
      const resFinance = await fetch(`/api/budget-report/finance-overview?${financeParams.toString()}`);
      
      const resProjects = await fetch("/api/budget-report/approved-projects");

      if (resReports.ok && resFinance.ok) {
         const reportsData = await resReports.json();
         const financeData = await resFinance.json();
         
         setReports(reportsData.reports || []);
         
         setFinancialStats({
             income: financeData.income.total,
             expense: financeData.expense,
             balance: financeData.balance
         });

         if (resProjects.ok) {
            const projectsData = await resProjects.json();
            setApprovedProjects(projectsData.projects || []);
         }
      }
    } catch (error) { 
       console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoundId, filterYear]);

  useEffect(() => {
    fetchData(activeFilter === "ถังขยะ");
  }, [fetchData, activeFilter]);

  // ================= Logic การคำนวณปีและรอบ =================
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    reports.forEach(r => {
        if (r.createdAt) {
            const d = new Date(r.createdAt);
            const fiscalY = (d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear()) + 543;
            years.add(fiscalY);
        }
    });
    budgetRounds.forEach(b => {
        if (b.fiscalYear) {
            years.add(Number(b.fiscalYear));
        }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [reports, budgetRounds]);

  const isYearSelected = filterYear !== "all";
  const roundsForDisplay = useMemo(() => {
    if (!isYearSelected) return [];
    return budgetRounds.filter(round => String(round.fiscalYear) === String(filterYear));
  }, [budgetRounds, filterYear, isYearSelected]);

  // ================= Filtering Logic =================
  const filteredReports = reports.filter((report) => {
    if (activeFilter === "ถังขยะ") {
       // Pass
    } else if (activeFilter !== "ทั้งหมด") {
      const currentFilterKey = filters.find((f) => f.label === activeFilter)?.key;
      if (report.status !== currentFilterKey) return false;
    }

    const searchLower = reportSearchTerm.toLowerCase();
    const matchSearch = 
      report.reportTitle?.toLowerCase().includes(searchLower) ||
      report.proposal?.projectName?.toLowerCase().includes(searchLower);

    const dateToCheck = new Date(report.createdAt);
    const reportFiscalYear = (dateToCheck.getMonth() >= 9 ? dateToCheck.getFullYear() + 1 : dateToCheck.getFullYear()) + 543;
    const matchYear = filterYear === "all" || String(reportFiscalYear) === filterYear;
    const matchMonth = filterMonth === "all" || (dateToCheck.getMonth() + 1).toString() === filterMonth;

    return matchSearch && matchYear && matchMonth;
  });

  const filteredProjectsInModal = approvedProjects.filter((p) =>
    p.projectName.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const getStatusCount = (filterKey?: SummarySubmissionStatus) => {
    if (!filterKey) return reports.length;
    return reports.filter((r) => r.status === filterKey).length;
  };

  const handleSelectProject = (projectId: number) => {
    router.push(`/admin/budget_report/create?projectId=${projectId}`);
  };

  const handleCreateManual = () => {
    router.push(`/admin/budget_report/create`);
  };

  const handleTrashToggle = () => {
    if (activeFilter === "ถังขยะ") {
        setActiveFilter("ทั้งหมด");
    } else {
        setActiveFilter("ถังขยะ");
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header พร้อมปุ่มพับเก็บ */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-semibold text-gray-800">
                    {activeFilter === "ถังขยะ" ? "รายการที่ถูกลบ (ถังขยะ)" : "รายงานงบประมาณ"}
                </h1>
                
                {activeFilter !== "ถังขยะ" && (
                  <button 
                    onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-orange-200"
                  >
                    {isSummaryVisible ? (
                      <>
                        <ChevronUp className="w-4 h-4" /> ซ่อนภาพรวม
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" /> แสดงภาพรวม
                      </>
                    )}
                  </button>
                )}
            </div>
        </div>

        {/* Collapsible Section (เฉพาะ Financial Cards) */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryVisible ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                    <h3 className="text-amber-900 text-sm font-semibold opacity-90">งบประมาณที่ได้รับ (Income)</h3>
                    <p className="text-3xl font-semibold text-amber-800 mt-2">฿ {financialStats.income.toLocaleString()}</p>
                    <p className="text-xs text-amber-900 mt-2 font-medium opacity-70">
                        {filterYear === "all" ? "รวมทุกปีงบประมาณ" : `ปีงบประมาณ ${filterYear}`}
                    </p>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                    <h3 className="text-red-900 text-sm font-semibold opacity-90">ใช้จ่ายจริง (Expense)</h3>
                    <p className="text-3xl font-semibold text-red-900 mt-2">฿ {financialStats.expense.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                    <h3 className="text-orange-900 text-sm font-semibold opacity-90">คงเหลือ (Balance)</h3>
                    <p className="text-3xl font-semibold text-orange-700 mt-2">฿ {financialStats.balance.toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Status Filter Cards (อยู่นอกส่วนพับเก็บ แสดงตลอดเวลา) */}
        {activeFilter !== "ถังขยะ" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.label;
                
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
                    {getStatusCount(filter.key)}
                    </p>
                </div>
                );
            })}
            </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Search */}
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

            <div className="flex gap-2">
                {/* Year Select */}
                <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={filterYear}
                        onChange={(e) => {
                            setFilterYear(e.target.value);
                            setSelectedRoundId("all");
                        }}
                        className="pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer hover:bg-gray-50 min-w-[120px]"
                    >
                        <option value="all">ทุกปีงบประมาณ</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                
                {/* Round Select */}
                <div className="relative w-full sm:w-auto">
                  <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedRoundId}
                    onChange={(e) => setSelectedRoundId(e.target.value)}
                    disabled={!isYearSelected}
                    className={`w-full sm:w-auto pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer truncate min-w-44
                        ${!isYearSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}
                    `}
                  >
                    <option value="all">ทุกรอบการพิจารณา</option>
                    {roundsForDisplay
                      .sort((a, b) => a.roundName.localeCompare(b.roundName))
                      .map((round) => {
                        const match = round.roundName.match(/ที่\s*(\d+)/);
                        const roundNumber = match ? match[1] : null;
                        const displayName = roundNumber 
                            ? `รอบการพิจารณาที่ ${roundNumber}` 
                            : round.roundName;
                        
                        return (
                          <option key={round.id} value={round.id}>
                              {displayName}
                          </option>
                        );
                    })}
                  </select>
                </div>
            </div>

            {/* Trash Toggle Button */}
            <button
                onClick={handleTrashToggle}
                className={`
                    h-10 px-4 rounded-lg flex items-center gap-2 transition-all border shrink-0
                    ${activeFilter === "ถังขยะ" 
                        ? "bg-gray-500 text-white border-gray-600 shadow-md" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
                    }
                `}
                title={activeFilter === "ถังขยะ" ? "กลับไปหน้ารายงาน" : "ดูถังขยะ"}
            >
                {activeFilter === "ถังขยะ" ? (
                    <>
                        <Layers className="w-4 h-4" />
                        <span className="text-sm font-medium">ดูรายงานปกติ</span>
                    </>
                ) : (
                    <>
                        <History className="w-4 h-4" />
                        <span className="text-sm font-medium">กู้คืนรายงาน</span>
                    </>
                )}
            </button>
          </div>

          {activeFilter !== "ถังขยะ" && (
            <button
                onClick={() => setIsSelectModalOpen(true)}
                className="w-full md:w-auto h-10 px-6 rounded-lg bg-orange-500 text-sm text-white flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm whitespace-nowrap"
            >
                <CirclePlus className="w-5 h-5" />
                เพิ่มรายงาน
            </button>
          )}
        </div>

        {/* Report List Content... */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredReports.map((report) => (
              <BudgetReportCard 
                key={report.id} 
                report={report} 
                onUpdate={() => fetchData(activeFilter === "ถังขยะ")}
                isTrash={activeFilter === "ถังขยะ"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
              {activeFilter === "ถังขยะ" ? (
                <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            ) : (
                <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            )}
            <p className="text-gray-500">
               {activeFilter === "ถังขยะ" 
                ? "ไม่มีรายการในถังขยะ" 
                : "ไม่พบรายงานตามเงื่อนไขที่กำหนด"}
            </p>
            <button 
              onClick={() => {
                setReportSearchTerm("");
                setFilterYear("all");
                setFilterMonth("all");
                if(activeFilter !== "ถังขยะ") setActiveFilter("ทั้งหมด");
              }}
              className="text-orange-500 hover:underline mt-2 text-sm"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Modal Selection */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">เลือกโครงการ</h3>
                <p className="text-sm text-gray-500 mt-1">
                  เลือกโครงการที่ <span className="text-green-600 font-medium">อนุมัติแล้ว</span> เพื่อเริ่มทำรายงาน
                </p>
              </div>
              <button onClick={() => setIsSelectModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
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