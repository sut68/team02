"use client";

import { Edit2, Trash2 } from "lucide-react";
import { ProjectWithManager } from "@/app/types/budget_approval";
import { deleteProject } from "@/app/lib/actions";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/app/components/ui/Card";

interface ProjectCardProps {
  project: ProjectWithManager;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบโครงการนี้?")) return;

    setIsDeleting(true);
    try {
      await deleteProject(project.ppid!);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("เกิดข้อผิดพลาดในการลบโครงการ");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (statusId?: number) => {
    switch (statusId) {
      case 1: return "bg-gray-400";
      case 2: return "bg-orange-500";
      case 3: return "bg-gray-500";
      case 4: return "bg-yellow-500";
      default: return "bg-gray-200";
    }
  };

  return (
    // เพิ่ม p-4 เพื่อให้มีพื้นที่ว่างรอบๆ เนื้อหาข้างในทั้งหมด และเพิ่มมุมมนให้การ์ด
    <Card className="p-4 rounded-4xl border-none shadow-sm bg-white h-full flex flex-col">
      
      {/* Project Image Container */}
      {/* ลบ -m-4 ออก เพื่อให้รูปอยู่ข้างใน padding ของการ์ด */}
      <div className="relative w-full aspect-4/3 mb-4 overflow-hidden rounded-2xl">
        {project.coverFilePath ? (
          <img
            src={project.coverFilePath}
            alt={project.projectName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 text-sm">ไม่มีรูปภาพ</p>
          </div>
        )}
        
        {/* Status Dot - ย้ายมามุมขวาล่าง (bottom-2 right-2) */}
        <div
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-2 border-white ${getStatusColor(
            project.statusId
          )}`}
        ></div>
      </div>

      {/* Project Info */}
      <CardContent className="p-0 mb-4 grow">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
          {project.projectName}
        </h3>
        <p className="text-gray-500 font-light">
          คะแนนโหวต : <span className="font-normal">{project.scoreTotal?.toLocaleString() || 0} คะแนน</span>
        </p>
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="p-1 justify-end gap-0">
        {/* ปุ่มแก้ไข - ทรงแคปซูล (rounded-full) */}
        <button
          onClick={() => alert("ฟังก์ชันแก้ไขยังไม่พร้อมใช้งาน")}
          className="flex-1 bg-[#F36618] text-white h-12 rounded-full hover:bg-orange-700 transition flex items-center justify-center gap-2 text-base font-medium"
        >
          <Edit2 className="w-5 h-5" />
          แก้ไข
        </button>
        
        {/* ปุ่มลบ - สีเทาเข้ม ทรงแคปซูล/วงรี (rounded-full) */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-14 h-12 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition flex items-center justify-center disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </CardFooter>
    </Card>
  );
}