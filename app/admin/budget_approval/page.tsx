"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  RefreshCw,
  ThumbsUp,
  Ban,
  CheckCircle,
  CirclePlus,
} from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectStatus, ProjectWithManager } from "@/app/types/budget_approval";

// --- Configuration ---
const statusFilters: {
  label: ProjectStatus;
  icon: any;
  id?: number; // หมายเหตุ: statusId ใน DB อาจต้อง map ให้ตรงกับที่นี่
  key?: string; // เพิ่ม key สำหรับ map กับ enum status (DRAFT, PENDING, etc.)
}[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "รอดำเนินการ", icon: RefreshCw, key: 'DRAFT' },
  { label: "เปิดรับโหวต", icon: ThumbsUp, key: 'PENDING' },
  { label: "ปิดรับโหวต", icon: Ban, key: 'CLOSED' }, // สมมติ
  { label: "อนุมัติแล้ว", icon: CheckCircle, key: 'APPROVED' },
];

export default function ProjectManagementPage() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>("ทั้งหมด");
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ดึงข้อมูลจริงจาก API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/project-proposal');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.proposals);
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Filter Logic
  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "ทั้งหมด") return true;
    
    // Logic การกรอง: ต้องดูว่า API ส่ง status มาเป็น String (Enum) หรือ Int
    // สมมติว่าส่งมาเป็น String (DRAFT, PENDING, APPROVED) ตาม Schema
    const filterConfig = statusFilters.find(f => f.label === activeFilter);
    if (!filterConfig?.key) return false;
    
    // เช็ค property 'status' จาก API response
    return (project as any).status === filterConfig.key;
  });

  // Helper: นับจำนวนโครงการตามสถานะ
  const getStatusCount = (statusLabel: ProjectStatus, filterKey?: string) => {
    if (statusLabel === "ทั้งหมด") return projects.length;
    if (!filterKey) return 0;
    return projects.filter((p) => (p as any).status === filterKey).length;
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;
            const count = getStatusCount(filter.label, filter.key);

            return (
              <div
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`
                  cursor-pointer 
                  border-2 
                  rounded-xl 
                  bg-white 
                  transition-all 
                  duration-300 
                  ease-out
                  hover:shadow-md
                  ${isActive 
                    ? 'border-orange-300 shadow-[0_0_15px_rgba(242,101,34,0.15)]' 
                    : 'border-orange-100'
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
                  <h3 className={`text-base font-normal transition-colors ${
                      isActive ? "text-gray-900" : "text-gray-500"
                  }`}>
                    {filter.label}
                  </h3>
                  <p className={`text-2xl font-medium mt-2 ${
                      isActive ? "text-orange-600" : "text-gray-400"
                  }`}>
                    {loading ? "..." : count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            โครงการส่งพิจารณา
          </h2>
          <Link
            href="/admin/budget_approval/create"
            className=" h-10 bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <CirclePlus className="w-5 h-5" />
            <span className="font-semibold">เพิ่มโครงการ</span>
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredProjects.map((project) => (
              // @ts-ignore
              <ProjectCard key={project.id || project.ppid} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-35 rounded-xl">
            <div className="text-gray-300 mb-4">
              <Layers className="w-16 h-16 mx-auto" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-4">ไม่พบโครงการ</p>
          </div>
        )}
      </div>
    </main>
  );
}