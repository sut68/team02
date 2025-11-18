"use client"; // ใส่บรรทัดนี้เพื่อให้ใช้ useState ได้

import { useState } from "react";
import {
  Layers,
  Clock,
  Volume2,
  XCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import ProjectCard from "@/app/components/ui/ProjectCard";
import { ProjectStatus } from "@/app/types/budget_approval";
import { ProjectManager, ProjectWithManager } from '@/app/types/budget_approval';

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

const statusFilters: {
  label: ProjectStatus;
  icon: any;
  color: string;
  id?: number;
}[] = [
  { label: "ทั้งหมด", icon: Layers, color: "text-orange-500" },
  { label: "รอดำเนินการ", icon: Clock, color: "text-orange-500", id: 1 },
  { label: "เปิดรับโหวต", icon: Volume2, color: "text-orange-500", id: 2 },
  { label: "ปิดรับโหวต", icon: XCircle, color: "text-orange-500", id: 3 },
  { label: "อนุมัติแล้ว", icon: CheckCircle, color: "text-orange-500", id: 4 },
];

export default function ProjectManagementPage() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>("ทั้งหมด");

  const filteredProjects = mockProjects.filter((project) => {
    if (activeFilter === "ทั้งหมด") return true;

    const selectedStatus = statusFilters.find((f) => f.label === activeFilter);

    return project.statusId === selectedStatus?.id;
  });

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Filters */}
        <div className="flex flex-wrap justify-start gap-4 mb-8"> 
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.label;

            return (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`
    relative w-50 h-55 rounded-[20px] p-1 transition-all duration-300 ease-out
    flex flex-col items-center justify-center gap-4 group
    ${
      isActive
        ? "bg-white shadow-[0_0_25px_rgba(242,101,34,0.5)] border border-orange-100"
        : "bg-white shadow-sm hover:shadow-md border border-transparent"
    }
  `}
              >
                <div className={`transition-transform duration-300`}>
                  <Icon
                    className={`w-22 h-22 transition-colors duration-300 ${
                      isActive
                        ? "text-[#F26522]"
                        : "text-gray-300 group-hover:text-[#F26522]"
                    }`}
                    strokeWidth={0.8}
                  />
                </div>
                <span
                  className={`text-md font-light transition-colors duration-300 ${
                    isActive
                      ? "text-gray-800"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                >
                  {filter.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            โครงการส่งพิจารณา ({filteredProjects.length})
          </h2>
          <Link
            href="/admin/budget_approval/create" // *เช็ค path ให้ตรงกับชื่อโฟลเดอร์จริง (approval)*
            className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            เพิ่มโครงการ
          </Link>
        </div>

        {/* Projects Grid - แสดงผลจาก filteredProjects แทน mockProjects */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.ppid} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Layers className="w-16 h-16 mx-auto" strokeWidth={1.0} />
            </div>
            <p className="text-gray-500 text-lg mb-4">ไม่พบโครงการในสถานะนี้</p>
            {/* ปุ่มเพิ่มโครงการจะแสดงเฉพาะตอนไม่มีข้อมูลเลย หรือจะให้แสดงตลอดก็ได้ */}
            {mockProjects.length === 0 && (
              <Link
                href="/admin/budget_approval/create"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                เพิ่มโครงการใหม่
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}