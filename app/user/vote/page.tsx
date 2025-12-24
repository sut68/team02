"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // สำหรับ Redirect (ถ้าจำเป็น)
import { PrimaryButton } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Loader2, Building2, Coins, User } from "lucide-react";
import { ProjectWithManager, ProjectVote } from "@/app/types/budget_approval";

// ✅ เรียกใช้ UI Modal ที่มีอยู่แล้ว
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import SuccessModal from "@/app/components/ui/SuccessModal";

export default function VotePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State: สถานะการโหวตของผู้ใช้
  const [userVotedId, setUserVotedId] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [canVote, setCanVote] = useState(false);

  // State: จัดการ Modal
  const [targetProject, setTargetProject] = useState<{id: number, name: string} | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'CONFIRM' | 'SUCCESS' | 'ERROR' | null;
    message?: string;
    title?: string;
  }>({ type: null });

  // 1. ฟังก์ชันดึงข้อมูลโครงการ
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/project-proposal"); 
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      
      const data = await res.json();
      setProjects(data.proposals || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);

  // 2. ฟังก์ชันเช็คสถานะการโหวต (API จะเช็คตามรอบงบประมาณที่ OPEN ให้อัตโนมัติ)
  const fetchUserVoteStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/project-vote"); 
      if (res.ok) {
        const data = await res.json();
        
        // รับค่า canVote มาเก็บไว้
        setCanVote(data.canVote); 

        if (data.voted) {
          setUserVotedId(data.votedProjectId);
        } else {
          setUserVotedId(null);
        }
      }
    } catch (err) {
      console.error("Failed to check vote status:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchUserVoteStatus()]);
      setLoading(false);
    };
    init();
  }, [fetchProjects, fetchUserVoteStatus]);

  // --- Handlers ---

  // 3.1 ขั้นตอนแรก: กดปุ่มโหวต -> เปิด Modal ยืนยัน
  const handleVoteClick = (projectId: number, projectName: string) => {
    if (userVotedId) return; // กันไว้ที่ UI อีกชั้น
    setTargetProject({ id: projectId, name: projectName });
    setModalState({ type: 'CONFIRM' });
  };

  // 3.2 ขั้นตอนสอง: ยืนยันใน Modal -> ยิง API
  const confirmVote = async () => {
    if (!targetProject) return;

    setIsVoting(true);
    try {
      const res = await fetch("/api/project-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: targetProject.id }),
      });

      const result = await res.json();

      if (!res.ok) {
        // กรณี Error: เช่น ยังไม่บริจาค (403) หรือ โหวตซ้ำ (400)
        // ใช้ข้อความจาก Backend แสดงผลเลย
        throw new Error(result.error || "เกิดข้อผิดพลาดในการโหวต");
      }

      // กรณีสำเร็จ
      setModalState({ 
        type: 'SUCCESS', 
        message: "ขอบคุณสำหรับการโหวต! คะแนนของคุณถูกบันทึกเรียบร้อยแล้ว" 
      });
      
      setUserVotedId(targetProject.id); 
      fetchProjects(); // รีเฟรชคะแนน

    } catch (err: any) {
      // แสดง Error Modal
      setModalState({
        type: 'ERROR',
        title: "ไม่สามารถโหวตได้",
        message: err.message
      });
    } finally {
      setIsVoting(false);
    }
  };

  // ปิด Modal ทั้งหมด
  const closeModal = () => {
    setModalState({ type: null });
    if (modalState.type !== 'CONFIRM') {
        setTargetProject(null);
    }
  };

  // --- Logic การคำนวณและแบ่งกลุ่ม ---
  const votingProjects = projects.filter((p) => p.status === "OPEN");
  const resultProjects = projects.filter((p) => p.status === "APPROVED" || p.status === "CLOSE");

  const calculateScore = (votes?: Partial<ProjectVote>[]) => {
    if (!votes || votes.length === 0) return 0;
    return votes.reduce((acc, curr) => acc + (curr.voteWeight || 0), 0);
  };

  const calculatePercentage = (votes?: Partial<ProjectVote>[]) => {
    const score = calculateScore(votes);
    return Math.min(((score / 100) * 100), 100).toFixed(1); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-orange-500" /> กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* --- Hero Section --- */}
      <section className="relative w-full h-[300px] md:h-[380px] overflow-hidden mb-12 bg-gray-100">
        <Image
          src="/18.jpg"
          alt="Banner พิจารณาโครงการ"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-l from-white/90 via-white/40 to-transparent" />
        <div className="absolute inset-0 container mx-auto px-4 md:px-8 max-w-7xl flex items-center justify-end">
          <h1 className="text-3xl md:text-5xl font-bold text-orange-600 drop-shadow-sm mt-12 md:mt-0">
            พิจารณาโครงการ
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        {/* --- Section 1: พิจารณาโครงการ (Voting) --- */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-8 border-l-4 border-orange-500 pl-4">
            พิจารณาโครงการ
          </h2>

          {votingProjects.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
              ขณะนี้ยังไม่มีโครงการที่เปิดให้โหวต
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {votingProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white rounded-2xl p-0"
                >
                  {/* รูปภาพ */}
                  <div className="relative w-full aspect-4/3 bg-gray-100 overflow-hidden rounded-xl">
                    {project.coverFilePath ? (
                      <Image
                        src={project.coverFilePath}
                        alt={project.projectName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <span className="text-sm">ไม่มีรูปภาพ</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      เปิดโหวต
                    </div>
                  </div>

                  {/* เนื้อหา */}
                  <div className="p-5 flex flex-col grow">
                    <h3 
                        className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-snug min-h-14"
                        title={project.projectName}
                    >
                      {project.projectName}
                    </h3>
                    
                    <div className="w-10 h-1 bg-orange-200 rounded-full mb-3"></div>

                    <div className="space-y-2 mb-6 text-xs text-gray-500 grow">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                        <span className="line-clamp-1">{project.responsibilityUnit || "-"}</span>
                      </div>
                      {project.manager && (
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                          <span className="line-clamp-1">{project.manager.firstName} {project.manager.lastName}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Coins className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                        <span>งบประมาณ: {project.requestedAmount?.toLocaleString() || 0} บาท</span>
                      </div>
                    </div>

                    {/* ปุ่มโหวต (Interactive) */}
                    <div className="mt-auto">
                      <PrimaryButton
                        className={`w-full rounded-full py-2.5 text-sm font-semibold transition-all ${
                          userVotedId
                            ? userVotedId === project.id 
                                ? "bg-[#F26522] hover:bg-orange-600 text-white shadow-none cursor-default" 
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : canVote 
                                ? "bg-[#F26522] shadow-md hover:shadow-orange-200 hover:-translate-y-0.5" // โหวตได้ปกติ
                                : "bg-gray-300 text-gray-500 cursor-not-allowed" // ❌ ยังไม่บริจาค (ปุ่มเทา)
                        }`}
                        // ปิดปุ่มถ้า: โหวตไปแล้ว หรือ กำลังโหลด หรือ (ยังไม่บริจาค และ ยังไม่ได้โหวต)
                        disabled={!!userVotedId || isVoting || (!canVote && !userVotedId)}
                        onClick={() => {
                            if (!canVote && !userVotedId) {
                                alert("กรุณาร่วมบริจาคในรอบงบประมาณนี้ก่อนทำการโหวต");
                                return;
                            }
                            handleVoteClick(project.id, project.projectName);
                        }}
                      >
                        {userVotedId === project.id 
                          ? "คุณโหวตโครงการนี้แล้ว" 
                          : userVotedId 
                            ? "ใช้สิทธิ์ครบแล้ว" 
                            : isVoting 
                              ? "กำลังโหวต..." 
                              : canVote 
                                ? "โหวต" 
                                : "บริจาคเพื่อรับสิทธิ์โหวต"}
                      </PrimaryButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* --- Section 2: ผลพิจารณาโครงการ --- */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-8 border-l-4 border-gray-400 pl-4">
            ผลพิจารณาโครงการ
          </h2>

          {resultProjects.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
              ยังไม่มีผลการพิจารณาโครงการในขณะนี้
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl">
              {resultProjects.map((project) => {
                const percentage = calculatePercentage(project.votes);
                const isApproved = project.status === 'APPROVED';
                
                return (
                  <div 
                    key={project.id} 
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center"
                  >
                    <div className="relative w-full md:w-48 h-48 md:h-32 shrink-0 bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
                      {project.coverFilePath ? (
                        <Image
                          src={project.coverFilePath}
                          alt={project.projectName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                    </div>

                    <div className="grow w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                            {project.projectName}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                หน่วยงาน: {project.responsibilityUnit} | งบประมาณ: {project.requestedAmount?.toLocaleString()} บาท
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            {isApproved ? (
                                <span className="text-2xl font-bold text-[#F26522]">{percentage}%</span>
                            ) : (
                                <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">ไม่ผ่านการอนุมัติ</span>
                            )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="font-semibold text-gray-600">ผลการอนุมัติ:</span>
                            <span className={`font-bold ${isApproved ? 'text-green-600' : 'text-red-500'}`}>
                                {isApproved ? 'อนุมัติ' : 'ไม่อนุมัติ / ปิดรับ'}
                            </span>
                        </div>

                        {isApproved && (
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-[#F26522] h-2.5 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${Math.min(Number(percentage), 100)}%` }} 
                            />
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}
      
      {/* 1. Modal ยืนยันการโหวต */}
      <ConfirmModal 
        isOpen={modalState.type === 'CONFIRM'}
        onClose={closeModal}
        onConfirm={confirmVote}
        title="ยืนยันการโหวต"
        message={`คุณต้องการโหวตให้โครงการ "${targetProject?.name}" ใช่หรือไม่?\n(ท่านสามารถโหวตได้เพียง 1 โครงการต่อรอบ)`}
        confirmLabel="ยืนยันการโหวต"
        cancelLabel="ยกเลิก"
        isLoading={isVoting}
      />

      {/* 2. Modal สำเร็จ */}
      <SuccessModal 
        show={modalState.type === 'SUCCESS'}
        message={modalState.message}
        onClose={closeModal}
      />

      {/* 3. Modal Error / แจ้งเตือน (เช่น ยังไม่ได้บริจาค) */}
      <ConfirmModal 
        isOpen={modalState.type === 'ERROR'}
        onClose={closeModal}
        onConfirm={closeModal} // ปุ่มยืนยันทำหน้าที่เป็นปุ่มปิด
        title={modalState.title || "แจ้งเตือน"}
        message={modalState.message || "เกิดข้อผิดพลาด"}
        confirmLabel="ตกลง"
        cancelLabel="" // ซ่อนปุ่มยกเลิกเพื่อให้เป็นปุ่มเดียว
        isDanger={true} // สีแดงเพื่อบ่งบอกว่าเป็น Error/Warning
      />

    </div>
  );
}