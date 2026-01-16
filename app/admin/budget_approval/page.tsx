"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, RefreshCw, ThumbsUp, Ban, CheckCircle, CirclePlus, Settings2, Search, Loader2, History, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectWithManager } from "@/app/types/budget_approval";

// Filter Label
type FilterLabel = "ทั้งหมด" | "รอดำเนินการ" | "เปิดรับโหวต" | "ปิดรับโหวต" | "อนุมัติแล้ว" | "ถังขยะ";

const statusFilters: { label: FilterLabel; icon: any; key?: string }[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "รอดำเนินการ", icon: RefreshCw, key: "PENDING" },
  { label: "เปิดรับโหวต", icon: ThumbsUp, key: "OPEN" },
  { label: "ปิดรับโหวต", icon: Ban, key: "CLOSE" },
  { label: "อนุมัติแล้ว", icon: CheckCircle, key: "APPROVED" },
];

export default function ProjectManagementPage() {
  const [activeFilter, setActiveFilter] = useState<FilterLabel>("ทั้งหมด");
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterRound, setFilterRound] = useState<string>("all");
  
  // Data for Dropdowns
  const [budgetRounds, setBudgetRounds] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // 1. Fetch Budget Rounds (สำหรับใส่ใน Dropdown)
  const fetchBudgetRounds = useCallback(async () => {
    try {
      const res = await fetch("/api/budget-round");
      if (res.ok) {
        const data = await res.json();
        const rounds = data.budgetRounds || []; 
        
        if (Array.isArray(rounds)) {
            setBudgetRounds(rounds);
            // ✅ ดึงปีงบประมาณที่ไม่ซ้ำกันมาใส่ Dropdown (Dynamic)
            const years = Array.from(new Set(rounds.map((r: any) => r.fiscalYear)))
                .filter(y => y) // กรองค่า null/undefined ออก
                .sort()
                .reverse() as string[];
            setAvailableYears(years);
        } else {
            setBudgetRounds([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch budget rounds", error);
      setBudgetRounds([]); 
    }
  }, []);

  useEffect(() => {
    fetchBudgetRounds();
  }, [fetchBudgetRounds]);

  // 2. Fetch Projects (ส่ง filterYear และ filterRound ไปให้ API กรอง)
  const fetchProjects = useCallback(async (isTrashMode: boolean = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (isTrashMode) params.append("trash", "true");
      
      // ✅ ส่งปีงบประมาณไปให้ API (ใน route.ts มีการเช็ค where.budgetRound = { fiscalYear: ... })
      if (filterYear !== "all") params.append("fiscalYear", filterYear);
      
      // ✅ ส่งรอบไปให้ API
      if (filterRound !== "all") params.append("budgetRoundId", filterRound);

      const res = await fetch(`/api/project-proposal?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.proposals || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterRound]);

  // โหลดข้อมูลเมื่อ filter เปลี่ยน
  useEffect(() => {
    fetchProjects(activeFilter === "ถังขยะ");
  }, [fetchProjects, activeFilter]);

  // Handler สลับโหมดถังขยะ
  const handleTrashToggle = () => {
    if (activeFilter === "ถังขยะ") {
        setActiveFilter("ทั้งหมด");
    } else {
        setActiveFilter("ถังขยะ");
    }
  };

  // 3. Client-Side Filter Logic (Status Tabs & Search Text)
  const filteredProjects = projects.filter((project) => {
    // 1. Status Filter
    let matchStatus = true;
    if (activeFilter !== "ถังขยะ" && activeFilter !== "ทั้งหมด") {
        const filterConfig = statusFilters.find((f) => f.label === activeFilter);
        matchStatus = filterConfig?.key ? project.status === filterConfig.key : false;
    }

    // 2. Search Filter
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = project.projectName.toLowerCase().includes(searchLower);

    return matchStatus && matchSearch;
  });

  const getStatusCount = (filterKey?: string) => {
    if (!filterKey) return projects.length;
    return projects.filter((p) => p.status === filterKey).length;
  };

  // --- Logic สำหรับ Dropdown รอบงบประมาณ ---
  const isYearSelected = filterYear !== "all";

  // กรองรอบตามปีที่เลือก
  const roundsForDisplay = Array.isArray(budgetRounds) 
    ? budgetRounds.filter(r => filterYear === "all" || r.fiscalYear === filterYear)
    : [];

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-semibold text-gray-800">
                {activeFilter === "ถังขยะ" ? "รายการที่ถูกลบ (ถังขยะ)" : "โครงการส่งพิจารณา"}
            </h1>
        </div>

        {/* Status Cards (ซ่อนเมื่ออยู่โหมดถังขยะ) */}
        {activeFilter !== "ถังขยะ" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statusFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.label;
                return (
                <div
                    key={filter.label}
                    onClick={() => setActiveFilter(filter.label)}
                    className={`cursor-pointer border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all ${
                    isActive ? "border-orange-300 shadow-md" : "border-orange-100"
                    }`}
                >
                    <div className="mb-4 flex justify-center">
                      <Icon className={`w-14 h-14 ${isActive ? "text-orange-500" : "text-orange-300"}`} strokeWidth={1.3} />
                    </div>
                    <h3 className={`text-base ${isActive ? "text-gray-900" : "text-gray-500"}`}>{filter.label}</h3>
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
           
           {/* Left Side: Search & Filters */}
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อโครงการ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Filter Year (Fiscal Year) */}
                <div className="relative w-full sm:w-auto">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filterYear}
                    onChange={(e) => {
                        setFilterYear(e.target.value);
                        setFilterRound("all"); // Reset รอบเมื่อเปลี่ยนปี
                    }}
                    className="w-full sm:w-auto pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer hover:bg-gray-50 min-w-[140px]"
                  >
                    <option value="all">ทุกปีงบประมาณ</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Round */}
                <div className="relative w-full sm:w-auto">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filterRound}
                    onChange={(e) => setFilterRound(e.target.value)}
                    disabled={!isYearSelected}
                    className={`w-full sm:w-auto pl-9 pr-8 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer truncate min-w-44
                        ${!isYearSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}
                    `}
                  >
                    <option value="all">ทุกรอบการพิจารณา</option>
                    
                    {/* ใช้ Dynamic Logic: ดึงเลขจากชื่อจริง ไม่ Hardcode */}
                    {isYearSelected && roundsForDisplay
                        .sort((a, b) => a.roundName.localeCompare(b.roundName))
                        .map((round) => {
                            // ดึงตัวเลขหลังคำว่า "ที่" จากชื่อรอบใน Database
                            const match = round.roundName.match(/ที่\s*(\d+)/);
                            const roundNumber = match ? match[1] : null;

                            // ถ้ามีเลข ให้แสดง "รอบการพิจารณาที่ X" ถ้าไม่มีให้แสดงชื่อเดิม
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

                {/* Trash Toggle */}
                <button
                    onClick={handleTrashToggle}
                    className={`
                        h-10 px-4 rounded-lg flex items-center gap-2 transition-all border shrink-0 ml-auto sm:ml-0 text-sm font-medium
                        ${activeFilter === "ถังขยะ" 
                            ? "bg-gray-500 text-white border-gray-600 shadow-md" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
                        }
                    `}
                    title={activeFilter === "ถังขยะ" ? "กลับไปหน้าปกติ" : "ดูถังขยะ"}
                >
                    {activeFilter === "ถังขยะ" ? (
                        <>
                            <Layers className="w-4 h-4" />
                            <span className="hidden sm:inline">ดูรายการปกติ</span>
                        </>
                    ) : (
                        <>
                            <History className="w-4 h-4" />
                            <span className="hidden sm:inline">กู้คืนโครงการ</span>
                        </>
                    )}
                </button>
           </div>

           {/* Right Side: Action Buttons */}
           {activeFilter !== "ถังขยะ" && (
            <div className="flex gap-2 w-full md:w-auto items-center">
                <Link 
                    href="/admin/budget_approval/budget_rounds" 
                    className="h-10 px-4 rounded-lg border border-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                <Settings2 className="w-5 h-5" />
                <span className="hidden sm:inline">จัดการรอบงบประมาณ</span>
                </Link>
                <Link 
                    href="/admin/budget_approval/create" 
                    className="h-10 px-6 rounded-lg bg-orange-500 text-white flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
                >
                <CirclePlus className="w-5 h-5" />
                เพิ่มโครงการ
                </Link>
            </div>
           )}
        </div>

        {/* Project List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
             <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
             กำลังโหลดข้อมูล...
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onUpdate={() => fetchProjects(activeFilter === "ถังขยะ")}
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
                {activeFilter === "ถังขยะ" ? "ไม่มีรายการในถังขยะ" : "ไม่พบโครงการตามเงื่อนไข"}
            </p>
            <button 
              onClick={() => { 
                  setSearchTerm(""); 
                  setFilterYear("all");
                  setFilterRound("all");
                  if(activeFilter !== "ถังขยะ") setActiveFilter("ทั้งหมด"); 
              }}
              className="text-orange-500 hover:underline mt-2 text-sm"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>
    </main>
  );
}