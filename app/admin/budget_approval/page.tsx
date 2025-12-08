"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, RefreshCw, ThumbsUp, Ban, CheckCircle, CirclePlus, Settings2 } from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectWithManager } from "@/app/types/budget_approval";

// Filter Label
type FilterLabel = "ทั้งหมด" | "รอดำเนินการ" | "เปิดรับโหวต" | "ปิดรับโหวต" | "อนุมัติแล้ว";

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

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/project-proposal");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.proposals || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter
  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "ทั้งหมด") return true;
    const filterConfig = statusFilters.find((f) => f.label === activeFilter);
    return filterConfig?.key ? project.status === filterConfig.key : false;
  });

  const getStatusCount = (filterKey?: string) => {
    if (!filterKey) return projects.length;
    return projects.filter((p) => p.status === filterKey).length;
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards นับจำนวน */}
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
                  {loading ? "..." : getStatusCount(filter.key)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">โครงการส่งพิจารณา</h2>
          <div className="flex gap-2">
            <Link href="/admin/budget_approval/budget_rounds" className="h-10 px-6 rounded-lg border border-gray-300 flex items-center gap-2 hover:bg-gray-50">
              <Settings2 className="w-5 h-5" />จัดการรอบงบประมาณ
            </Link>
            <Link href="/admin/budget_approval/create" className="h-10 px-6 rounded-lg bg-orange-500 text-white flex items-center gap-2 hover:bg-orange-600">
              <CirclePlus className="w-5 h-5" />เพิ่มโครงการ
            </Link>
          </div>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onUpdate={fetchProjects} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
            <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ไม่พบโครงการ</p>
          </div>
        )}
      </div>
    </main>
  );
}