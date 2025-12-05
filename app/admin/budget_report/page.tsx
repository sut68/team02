"use client";

import { useState } from "react";
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
} from "lucide-react";
import { BudgetReport, ReportStatus } from "@/app/types/budget_report";
import BudgetReportCard from "@/app/components/ui/BudgetReportCard";
import { Input } from "@/app/components/ui/Input";

// ... (Mock Data เดิม) ...
const mockReports: BudgetReport[] = [
  {
    id: 1,
    projectName: "รายงานงบประมาณโครงการทุนการศึกษา ภาค 1/2568",
    status: "ฉบับร่าง",
    updatedAt: "2025-01-20",
    imageSrc: "/Content/Event2.jpg",
  },
  {
    id: 2,
    projectName: "รายงานสรุปผลโครงการพัฒนาทักษะวิชาชีพวิศวกรรม",
    status: "รอตรวจสอบ",
    updatedAt: "2025-01-21",
    imageSrc: "/Content/Event5.jpg",
  },
];

const mockApprovedProjects = [
  {
    id: 101,
    name: "โครงการทุนการศึกษา ภาค 1/2568",
    org: "สำนักวิชาวิศวกรรมศาสตร์",
    date: "1 พ.ย. 2568",
    status: "อนุมัติแล้ว",
  },
  {
    id: 102,
    name: "โครงการอบรมเชิงปฏิบัติการ IoT",
    org: "สาขาวิศวกรรมคอมพิวเตอร์",
    date: "15 ธ.ค. 2568",
    status: "อนุมัติแล้ว",
  },
  {
    id: 103,
    name: "ค่ายอาสาพัฒนาชนบท รุ่นที่ 20",
    org: "ชมรมอาสาพัฒนา",
    date: "10 ม.ค. 2569",
    status: "อนุมัติแล้ว",
  },
];

const filters: { label: ReportStatus | "ทั้งหมด"; icon: any }[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "ฉบับร่าง", icon: FileText },
  { label: "รอตรวจสอบ", icon: Hourglass },
  { label: "อนุมัติ", icon: CheckCircle },
  { label: "ส่งกลับไปแก้ไข", icon: FileX2 },
];

export default function BudgetReportPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("ทั้งหมด");
  const [reports, setReports] = useState<BudgetReport[]>(mockReports);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter((report) =>
    activeFilter === "ทั้งหมด" ? true : report.status === activeFilter
  );
  const filteredProjects = mockApprovedProjects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เลือกโครงการ (มี ID) -> กรอกอัตโนมัติ
  const handleSelectProject = (projectId: number) => {
    router.push(`/admin/budget_report/create?projectId=${projectId}`);
  };

  // สร้างเอง (ไม่มี ID) -> ฟอร์มเปล่า
  const handleCreateManual = () => {
    router.push(`/admin/budget_report/create`);
  };

  return (
    <main className="min-h-screen bg-gray-50/30 font-sans py-4 px-4 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ... (Filter Section & Header เหมือนเดิม) ... */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;

            // ดึง Logic การนับจำนวนมาจากโค้ดเดิมของคุณ
            const count =
              filter.label === "ทั้งหมด"
                ? reports.length
                : reports.filter((r) => r.status === filter.label).length;

            return (
              <div
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`
          group
          cursor-pointer 
          border-2 
          rounded-xl 
          bg-white 
          transition-all 
          duration-300 
          ease-out
          hover:shadow-md
          ${
            isActive
              ? "border-orange-300 shadow-[0_0_15px_rgba(242,101,34,0.15)]"
              : "border-orange-100"
          }
        `}
              >
                <div className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className="mb-4 transition-transform duration-300 transform group-hover:scale-110">
                    <Icon
                      className={`w-14 h-14 transition-colors duration-300 ${
                        isActive ? "text-orange-500" : "text-orange-300"
                      }`}
                      strokeWidth={1.3}
                    />
                  </div>
                  <h3
                    className={`text-base font-normal transition-colors ${
                      isActive ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {filter.label}
                  </h3>
                  <p
                    className={`text-2xl font-medium mt-2 ${
                      isActive ? "text-orange-600" : "text-gray-400"
                    }`}
                  >
                    {count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            รายงานงบประมาณ
          </h2>
          <button
            onClick={() => setIsSelectModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#d9531e] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5"
          >
            <CirclePlus className="w-5 h-5" />
            <span className="font-semibold">เพิ่มรายงาน</span>
          </button>
        </div>

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <BudgetReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-4xl bg-white">
            <Layers className="w-15 h-15 text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium">
              ไม่พบรายงานในสถานะ "{activeFilter}"
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL เลือกโครงการ ================= */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  เลือกโครงการ
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  เลือกโครงการที่{" "}
                  <span className="text-green-600 font-medium">
                    อนุมัติแล้ว
                  </span>{" "}
                  เพื่อเริ่มทำรายงาน
                </p>
              </div>
              <button
                onClick={() => setIsSelectModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="px-8 pt-6 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-gray-50 border-gray-200 focus:bg-white transition-all h-12"
                  radius="full"
                />
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="group flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer transition-all duration-200 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-orange-700">
                          {project.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{project.org}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>เริ่ม: {project.date}</span>
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

            {/* Footer: ปุ่มสร้างเอง */}
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
