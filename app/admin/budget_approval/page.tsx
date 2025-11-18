"use client";

import { useState } from "react";
import {
  Layers,
  RefreshCw,
  ThumbsUp,
  Ban,
  CheckCircle,
  Plus,
  CirclePlus,
} from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectStatus } from "@/app/types/budget_approval";
import { ProjectManager, ProjectWithManager } from '@/app/types/budget_approval';

// --- Mock Data ---
const mockProjectManagers: ProjectManager[] = [
  {
    pmid: 1,
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    department: 'สำนักวิชาวิศวกรรมศาสตร์',
    position: 'หัวหน้าโครงการ',
    phoneNumber: '081-234-5678',
    email: 'somchai@sut.ac.th'
  }
];

const mockProjects: ProjectWithManager[] = [
  {
    ppid: 1,
    projectName: 'โครงการอบรมทักษะวิชาชีพ',
    objective: 'พัฒนาทักษะนักศึกษาวิศวกรรมศาสตร์',
    description: 'จัดกิจกรรมอบรมเชิงปฏิบัติการเพื่อพัฒนาทักษะด้านวิทยาศาสตร์และเทคโนโลยี',
    requestedAmount: 150000,
    projectStartDate: '2025-01-15',
    projectEndDate: '2025-03-30',
    responsibilityUnit: 'สำนักวิชาวิศวกรรมศาสตร์',
    coverFilePath: '',
    scoreTotal: 5474,
    statusId: 1,
    pmid: 1,
    bgrid: 1,
    staffId: 1,
    createdAt: '2025-01-01',
    manager: mockProjectManagers[0]
  }
];

// --- Configuration ---
const statusFilters: {
  label: ProjectStatus;
  icon: any;
  id?: number;
}[] = [
  { label: "ทั้งหมด", icon: Layers },
  { label: "รอดำเนินการ", icon: RefreshCw, id: 1 },
  { label: "เปิดรับโหวต", icon: ThumbsUp, id: 2 },
  { label: "ปิดรับโหวต", icon: Ban, id: 3 },
  { label: "อนุมัติแล้ว", icon: CheckCircle, id: 4 },
];

export default function ProjectManagementPage() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>("ทั้งหมด");

  // Filter Logic
  const filteredProjects = mockProjects.filter((project) => {
    if (activeFilter === "ทั้งหมด") return true;
    const selectedStatus = statusFilters.find((f) => f.label === activeFilter);
    return project.statusId === selectedStatus?.id;
  });

  // Helper: นับจำนวนโครงการตามสถานะ
  const getStatusCount = (statusLabel: ProjectStatus, statusId?: number) => {
    if (statusLabel === "ทั้งหมด") {
      return mockProjects.length;
    }
    return mockProjects.filter((p) => p.statusId === statusId).length;
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;
            const count = getStatusCount(filter.label, filter.id);

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
                    {count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            โครงการส่งพิจารณา ({filteredProjects.length})
          </h2>
          <Link
            href="/admin/budget_approval/create"
            className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <CirclePlus className="w-6 h-6" />
            เพิ่มโครงการ
          </Link>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.ppid} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
            <div className="text-gray-300 mb-4">
              <Layers className="w-16 h-16 mx-auto" strokeWidth={1.0} />
            </div>
            <p className="text-gray-500 text-lg mb-4">ไม่พบโครงการในสถานะนี้</p>
            {/* ปุ่มเพิ่มโครงการกรณีไม่มีข้อมูล */}
            {mockProjects.length === 0 && (
              <Link
                href="/admin/budget_approval/create"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
              >
                <CirclePlus className="w-6 h-6" />
                เพิ่มโครงการใหม่
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}