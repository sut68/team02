"use client";

import { PenLine, Trash2, ChevronDown } from "lucide-react";
import { ProjectWithManager } from "@/app/types/budget_approval";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/app/components/ui/Card";
import { useRouter } from 'next/navigation';

// ✅ Import Modal ดีไซน์ใหม่เข้ามา
import ConfirmModal from "@/app/components/ui/ConfirmModal";

interface ProjectCardProps {
  project: ProjectWithManager;
  onUpdate?: () => void;
}

const STATUS_OPTIONS = [
  { id: 1, label: "รอดำเนินการ", value: "PENDING", color: "bg-gray-400", textColor: "text-gray-600" },
  { id: 2, label: "เปิดรับโหวต", value: "OPEN", color: "bg-orange-500", textColor: "text-orange-600" },
  { id: 3, label: "ปิดรับโหวต", value: "CLOSE", color: "bg-gray-600", textColor: "text-gray-700" },
  { id: 4, label: "อนุมัติ", value: "APPROVED", color: "bg-yellow-500", textColor: "text-yellow-600" },
];

export default function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const router = useRouter();
  
  const projectId = project.id; 
  const initialOption = STATUS_OPTIONS.find(opt => opt.value === project.status) || STATUS_OPTIONS[0];

  const [currentOption, setCurrentOption] = useState(initialOption);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State สำหรับ Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingOption, setPendingOption] = useState<typeof STATUS_OPTIONS[0] | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // เพิ่ม state loading

  const activeStatusObj = currentOption;

  // --- Handlers ---
  const handleStatusClick = (option: typeof STATUS_OPTIONS[0]) => {
    setPendingOption(option);
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (pendingOption) {
      setIsLoading(true); // เริ่ม loading
      try {
        const res = await fetch('/api/project-proposal', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: projectId,
            status: pendingOption.value,
          }),
        });

        if (res.ok) {
          setCurrentOption(pendingOption);
          if (onUpdate) onUpdate(); 
          else router.refresh();
        } else {
          const errorData = await res.json();
          alert(`เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถอัปเดตสถานะได้"}`);
        }
      } catch (error) {
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      } finally {
        setIsLoading(false); // หยุด loading
        setIsConfirmOpen(false);
        setPendingOption(null);
      }
    }
  };

  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingOption(null);
  };

  const confirmDelete = async () => {
    if (!projectId) return;
    setIsLoading(true); // เริ่ม loading
    try {
        const res = await fetch(`/api/project-proposal?id=${projectId}`, { method: 'DELETE' });
        if (res.ok) {
            if (onUpdate) onUpdate(); 
            else router.refresh();
        } else {
            const data = await res.json();
            alert("ลบไม่สำเร็จ: " + (data.error || "Unknown error"));
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
        setIsLoading(false); // หยุด loading
        setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <Card className="p-4 rounded-[20px] border-none shadow-sm bg-white w-full h-full flex flex-col relative transition-all hover:shadow-md">
        
        {/* Image Section */}
        <div className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden group z-10 bg-gray-100 shrink-0">
          <div className="w-full h-full">
              {project.coverFilePath ? (
              <img 
                src={project.coverFilePath} 
                alt={project.projectName} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">ไม่มีรูปภาพ</div>
              )}
          </div>

          {/* Status Dropdown */}
          <div className="absolute bottom-2 right-2">
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-xl shadow-xl p-1 border border-gray-100 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right z-50">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={(e) => { e.stopPropagation(); handleStatusClick(option); }}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium w-full transition-colors ${currentOption.value === option.value ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    <span className="text-gray-700">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-full hover:bg-white transition-all ring-1 ring-black/5"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${activeStatusObj.color}`} />
              <span className="text-xs font-semibold text-gray-700">{activeStatusObj.label}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {isMenuOpen && <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-0 mb-6 grow flex flex-col">
          <h3 
            className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight" 
            title={project.projectName}
          >
            {project.projectName}
          </h3>
          <p className="text-gray-500 font-light mt-auto">
            คะแนนโหวต : <span className="font-normal">{project.scoreTotal?.toLocaleString() || 0} คะแนน</span>
          </p>
        </CardContent>

        {/* Footer Buttons */}
        <CardFooter className="p-0 flex justify-center gap-0 mt-auto shrink-0">
          {currentOption.value === 'PENDING' && (
            <button
              onClick={() => router.push(`/admin/budget_approval/edit/${projectId}`)}
              className="bg-[#F36618] text-white h-10 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 text-base font-medium px-8 w-30 mr-2"
            >
              <PenLine className="w-5 h-5" />
              แก้ไข
            </button>
          )}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className={`${currentOption.value === 'PENDING' ? 'w-14' : 'w-full'} h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center shrink-0`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </CardFooter>
      </Card>
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={cancelChange}
        onConfirm={confirmChange}
        title="ยืนยันการเปลี่ยนสถานะ"
        // ใส่ข้อความปกติ (Modal แบบนี้ไม่ต้องใส่ "" เพื่อไฮไลท์สี เพราะดีไซน์นี้ไม่มีไฮไลท์ตัวอักษร)
        message={`คุณต้องการเปลี่ยนสถานะเป็น "${pendingOption?.label}" ใช่หรือไม่?`} 
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        isDanger={false} // 🟠 เป็นสีส้ม
      />

      {/* 3. เรียกใช้ Modal ลบ (สีแดง) */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบโครงการ"
        message={`คุณต้องการลบโครงการ "${project.projectName}" ใช่หรือไม่?`} 
        confirmLabel="ลบโครงการ"
        cancelLabel="ยกเลิก"
        isDanger={true} // 🔴 เป็นสีแดง
      />

    </>
  );
}