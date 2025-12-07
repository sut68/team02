"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  RefreshCw,
  ThumbsUp,
  Ban,
  CheckCircle,
  CirclePlus,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectWithManager } from "@/app/types/budget_approval";

// กำหนดประเภทของ Filter Label
type FilterLabel =
  | "ทั้งหมด"
  | "รอดำเนินการ"
  | "เปิดรับโหวต"
  | "ปิดรับโหวต"
  | "อนุมัติแล้ว";

const statusFilters: {
  label: FilterLabel;
  icon: any;
  key?: string;
}[] = [
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

  // ✅ 1. สร้างฟังก์ชัน fetchProjects แบบ Reusable (ใช้ useCallback เพื่อประสิทธิภาพ)
  const fetchProjects = useCallback(async () => {
    try {
      // ไม่ต้อง setLoading(true) ที่นี่ เพื่อไม่ให้หน้ากระพริบตอนอัปเดต
      const res = await fetch("/api/project-proposal");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.proposals || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // เรียกข้อมูลเมื่อหน้าโหลด
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Logic การกรองข้อมูล
  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "ทั้งหมด") return true;
    const filterConfig = statusFilters.find((f) => f.label === activeFilter);
    if (!filterConfig?.key) return false;
    const projectStatus = (project as any).status || project.status;
    return projectStatus === filterConfig.key;
  });

  const getStatusCount = (filterKey?: string) => {
    if (!filterKey) return projects.length;
    return projects.filter((p) => {
      const status = (p as any).status || p.status;
      return status === filterKey;
    }).length;
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;
            const count = getStatusCount(filter.key);

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
                    {loading ? "..." : count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            โครงการส่งพิจารณา
          </h2>
          <div className="flex gap-2">
            <Link
              href="/admin/budget_approval/create-round"
              className="h-10 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Settings2 className="w-5 h-5" />
              <span className="font-medium">จัดการรอบงบประมาณ</span>
            </Link>
            <Link
              href="/admin/budget_approval/create"
              className="h-10 bg-orange-500 text-white border border-transparent px-6 py-3 rounded-lg hover:bg-orange-600 transition flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <CirclePlus className="w-5 h-5" />
              <span className="font-medium">เพิ่มโครงการ</span>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id || project.ppid}
                project={project}
                // ✅ 2. ส่งฟังก์ชัน fetchProjects ลงไปให้ลูกเรียกใช้ตอนอัปเดตเสร็จ
                onUpdate={fetchProjects}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-35 rounded-xl">
            <div className="text-gray-300 mb-4">
              <Layers className="w-16 h-16 mx-auto" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-4">
              ไม่พบโครงการ
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
