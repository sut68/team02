// "use client";

// import { PenLine, Trash2, ChevronDown, AlertCircle } from "lucide-react"; // เพิ่ม AlertCircle
// import { ProjectWithManager } from "@/app/types/budget_approval";
// import { useState } from "react";
// import { Card, CardContent, CardFooter } from "@/app/components/ui/Card";

// interface ProjectCardProps {
//   project: ProjectWithManager;
// }

// const STATUS_OPTIONS = [
//   { id: 1, label: "รอดำเนินการ", color: "bg-gray-400", textColor: "text-gray-600" },
//   { id: 2, label: "เปิดรับโหวต", color: "bg-orange-500", textColor: "text-orange-600" },
//   { id: 3, label: "ปิดรับโหวต", color: "bg-gray-500", textColor: "text-gray-600" },
//   { id: 4, label: "อนุมัติแล้ว", color: "bg-yellow-500", textColor: "text-yellow-600" },
// ];

// export default function ProjectCard({ project }: ProjectCardProps) {
//   const [currentStatus, setCurrentStatus] = useState(project.statusId);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
  
//   // State สำหรับระบบยืนยัน
//   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
//   const [pendingStatus, setPendingStatus] = useState<number | null>(null);

//   const activeStatusObj = STATUS_OPTIONS.find((s) => s.id === currentStatus) || STATUS_OPTIONS[0];
//   const pendingStatusObj = STATUS_OPTIONS.find((s) => s.id === pendingStatus);

//   // 1. เมื่อผู้ใช้กดเลือกใน Dropdown (ยังไม่เปลี่ยนจริง แค่เตรียมการ)
//   const handleStatusClick = (statusId: number) => {
//     setPendingStatus(statusId); // จำไว้ก่อนว่าจะเปลี่ยนเป็นอะไร
//     setIsMenuOpen(false);       // ปิด Dropdown
//     setIsConfirmOpen(true);     // เปิดหน้าต่างยืนยัน
//   };

//   // 2. เมื่อผู้ใช้กด "ยืนยัน" ใน Modal
//   const confirmChange = () => {
//     if (pendingStatus) {
//       setCurrentStatus(pendingStatus);
//       // ใส่โค้ดเรียก API ตรงนี้
//       console.log("Confirmed change to:", pendingStatus);
//     }
//     setIsConfirmOpen(false);
//     setPendingStatus(null);
//   };

//   // 3. เมื่อผู้ใช้กด "ยกเลิก"
//   const cancelChange = () => {
//     setIsConfirmOpen(false);
//     setPendingStatus(null);
//   };

//   return (
//     <>
//       <Card className="p-4 rounded-4xl border-none shadow-sm bg-white w-80 h-auto flex flex-col relative">
        
//         {/* Project Image Zone */}
//         <div className="relative w-full aspect-video mb-4 rounded-2xl group z-10">
//           <div className="w-full h-full overflow-hidden rounded-2xl">
//               {project.coverFilePath ? (
//               <img
//                   src={project.coverFilePath}
//                   alt={project.projectName}
//                   className="w-full h-full object-cover"
//               />
//               ) : (
//               <div className="w-full h-full bg-gray-100 flex items-center justify-center">
//                   <p className="text-gray-400 text-sm">ไม่มีรูปภาพ</p>
//               </div>
//               )}
//           </div>

//           {/* --- Dropdown --- */}
//           <div className="absolute bottom-2 right-2">
//             {isMenuOpen && (
//               <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-xl shadow-xl p-1 border border-gray-100 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right z-50">
//                 {STATUS_OPTIONS.map((option) => (
//                   <button
//                     key={option.id}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleStatusClick(option.id); // เปลี่ยนไปเรียก handleStatusClick แทน
//                     }}
//                     className={`
//                       flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium w-full transition-colors
//                       ${currentStatus === option.id ? "bg-gray-100" : "hover:bg-gray-50"}
//                     `}
//                   >
//                     <div className={`w-2 h-2 rounded-full ${option.color}`} />
//                     <span className="text-gray-700">{option.label}</span>
//                   </button>
//                 ))}
//               </div>
//             )}

//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setIsMenuOpen(!isMenuOpen);
//               }}
//               className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-full hover:bg-white transition-all ring-1 ring-black/5"
//             >
//               <div className={`w-2.5 h-2.5 rounded-full ${activeStatusObj.color}`} />
//               <span className="text-xs font-semibold text-gray-700">
//                   {activeStatusObj.label}
//               </span>
//               <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
//             </button>
            
//             {/* Backdrop Dropdown */}
//             {isMenuOpen && (
//               <div 
//                   className="fixed inset-0 z-[-1]" 
//                   onClick={(e) => {
//                       e.stopPropagation();
//                       setIsMenuOpen(false);
//                   }} 
//               />
//             )}
//           </div>
//         </div>

//         {/* Project Info */}
//         <CardContent className="p-0 mb-6 grow">
//           <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
//             {project.projectName}
//           </h3>
//           <p className="text-gray-500 font-light">
//             คะแนนโหวต : <span className="font-normal">{project.scoreTotal?.toLocaleString() || 0} คะแนน</span>
//           </p>
//         </CardContent>

//         {/* Action Buttons */}
//         <CardFooter className="p-0 flex justify-center gap-0 mt-auto">
//           <button
//             onClick={() => alert("ฟังก์ชันแก้ไข")}
//             className="bg-[#F36618] text-white h-12 rounded-full hover:bg-orange-700 transition flex items-center justify-center gap-2 text-base font-medium px-8"
//           >
//             <PenLine className="w-5 h-5" />
//             แก้ไข
//           </button>
          
//           <button
//             className="w-14 h-12 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition flex items-center justify-center shrink-0"
//           >
//             <Trash2 className="w-5 h-5" />
//           </button>
//         </CardFooter>
//       </Card>

//       {/* --- Confirmation Modal (แสดงเมื่อ isConfirmOpen = true) --- */}
//       {isConfirmOpen && (
//         <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//           <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            
//             <div className="flex flex-col items-center text-center gap-4">
//               {/* Icon เตือน */}
//               <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
//                 <AlertCircle className="w-6 h-6" />
//               </div>

//               <div>
//                 <h3 className="text-lg font-bold text-gray-900">ยืนยันการเปลี่ยนสถานะ</h3>
//                 <p className="text-sm text-gray-500 mt-1">
//                   คุณต้องการเปลี่ยนสถานะเป็น <br/>
//                   <span className={`font-bold ${pendingStatusObj?.textColor}`}>
//                     "{pendingStatusObj?.label}"
//                   </span> ใช่หรือไม่?
//                 </p>
//               </div>

//               <div className="flex gap-3 w-full mt-2">
//                 <button
//                   onClick={cancelChange}
//                   className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
//                 >
//                   ยกเลิก
//                 </button>
//                 <button
//                   onClick={confirmChange}
//                   className="flex-1 py-2.5 rounded-full bg-[#F36618] text-white font-medium hover:bg-orange-700 transition shadow-md shadow-orange-200"
//                 >
//                   ยืนยัน
//                 </button>
//               </div>
//             </div>

//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// app/components/ui/ProjectCard.tsx
// app/components/ui/ProjectCard.tsx
"use client";

import { PenLine, Trash2, ChevronDown, AlertCircle } from "lucide-react";
import { ProjectWithManager } from "@/app/types/budget_approval";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/app/components/ui/Card";
import { useRouter } from 'next/navigation'; // 1. อย่าลืม import useRouter

interface ProjectCardProps {
  project: ProjectWithManager;
}

const STATUS_OPTIONS = [
  { id: 1, label: "รอดำเนินการ", color: "bg-gray-400", textColor: "text-gray-600" },
  { id: 2, label: "เปิดรับโหวต", color: "bg-orange-500", textColor: "text-orange-600" },
  { id: 3, label: "ปิดรับโหวต", color: "bg-gray-500", textColor: "text-gray-600" },
  { id: 4, label: "อนุมัติแล้ว", color: "bg-yellow-500", textColor: "text-yellow-600" },
];

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter(); // 2. เรียกใช้ router hook
  const [currentStatus, setCurrentStatus] = useState(project.statusId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<number | null>(null);

  const activeStatusObj = STATUS_OPTIONS.find((s) => s.id === currentStatus) || STATUS_OPTIONS[0];
  const pendingStatusObj = STATUS_OPTIONS.find((s) => s.id === pendingStatus);

  const handleStatusClick = (statusId: number) => {
    setPendingStatus(statusId);
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmChange = () => {
    if (pendingStatus) {
      setCurrentStatus(pendingStatus);
      // โค้ดเรียก API เปลี่ยนสถานะใส่ตรงนี้
      console.log("Confirmed change to:", pendingStatus);
    }
    setIsConfirmOpen(false);
    setPendingStatus(null);
  };

  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Card className="p-4 rounded-4xl border-none shadow-sm bg-white w-80 h-auto flex flex-col relative">
        
        <div className="relative w-full aspect-video mb-4 rounded-2xl group z-10">
          <div className="w-full h-full overflow-hidden rounded-2xl">
              {project.coverFilePath ? (
              <img src={project.coverFilePath} alt={project.projectName} className="w-full h-full object-cover" />
              ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">ไม่มีรูปภาพ</div>
              )}
          </div>

          {/* Dropdown เลือกสถานะ */}
          <div className="absolute bottom-2 right-2">
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-xl shadow-xl p-1 border border-gray-100 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right z-50">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={(e) => { e.stopPropagation(); handleStatusClick(option.id); }}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium w-full transition-colors ${currentStatus === option.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
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

        <CardContent className="p-0 mb-6 grow">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{project.projectName}</h3>
          <p className="text-gray-500 font-light">คะแนนโหวต : <span className="font-normal">{project.scoreTotal?.toLocaleString() || 0} คะแนน</span></p>
        </CardContent>

        <CardFooter className="p-0 flex justify-center gap-0 mt-auto">
          {/* 3. Logic ซ่อน/แสดง ปุ่มแก้ไข */}
          {currentStatus === 1 && ( // เช็คว่าสถานะเป็น 1 (รอดำเนินการ) หรือไม่
            <button
              onClick={() => router.push(`/admin/budget_approval/edit/${project.ppid || 1}`)} // ลิงก์ไปหน้าแก้ไข
              className="bg-[#F36618] text-white h-10 rounded-full hover:bg-orange-700 transition flex items-center justify-center gap-2 text-base font-medium px-8"
            >
              <PenLine className="w-4 h-4" />
              แก้ไข
            </button>
          )}
          
          {/* ปุ่มลบ (ปรับขนาดอัตโนมัติตามสถานะปุ่มแก้ไข) */}
          <button className={`${currentStatus === 1 ? 'w-14 ml-2' : 'w-full'} h-10 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition flex items-center justify-center shrink-0`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </CardFooter>
      </Card>

      {/* Modal ยืนยันเปลี่ยนสถานะ */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการเปลี่ยนสถานะ</h3>
                <p className="text-sm text-gray-500 mt-1">คุณต้องการเปลี่ยนสถานะเป็น <br/><span className={`font-bold ${pendingStatusObj?.textColor}`}>"{pendingStatusObj?.label}"</span> ใช่หรือไม่?</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={cancelChange} className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">ยกเลิก</button>
                <button onClick={confirmChange} className="flex-1 py-2.5 rounded-full bg-[#F36618] text-white font-medium hover:bg-orange-700 transition shadow-md shadow-orange-200">ยืนยัน</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}