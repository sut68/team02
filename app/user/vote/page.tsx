// app/user/vote/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { PrimaryButton } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Loader2, Building2, Coins, User } from "lucide-react";
// ✅ Import Type จากไฟล์กลาง (ต้องมั่นใจว่าไฟล์ types ได้แก้ชื่อ field ตาม DB แล้ว)
import { ProjectWithManager, ProjectVote } from "@/app/types/budget_approval";

export default function VotePage() {
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับจัดการสถานะการโหวตของ User
  const [userVotedId, setUserVotedId] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

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

  // 2. ฟังก์ชันเช็คว่า User เคยโหวตไปหรือยัง
  const fetchUserVoteStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/project-vote"); 
      if (res.ok) {
        const data = await res.json();
        if (data.voted) {
          setUserVotedId(data.votedProjectId);
        }
      }
    } catch (err) {
      console.error("Failed to check vote status:", err);
    }
  }, []);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchUserVoteStatus()]);
      setLoading(false);
    };
    init();
  }, [fetchProjects, fetchUserVoteStatus]);

  // 3. ฟังก์ชันกดโหวต
  const handleVote = async (projectId: number, projectName: string) => {
    // กันไว้ก่อนเผื่อมีคนกดรัวๆ
    if (userVotedId) {
      alert("คุณได้ใช้สิทธิ์โหวตไปแล้ว");
      return;
    }

    const confirmMsg = `ยืนยันการโหวตให้โครงการ "${projectName}"?\n(คุณสามารถโหวตได้เพียง 1 โครงการเท่านั้น)`;
    if (!confirm(confirmMsg)) return;

    setIsVoting(true);
    try {
      const res = await fetch("/api/project-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "โหวตไม่สำเร็จ");
      }

      alert("🎉 ขอบคุณสำหรับการโหวต!");
      
      // อัปเดตสถานะหน้าเว็บทันที
      setUserVotedId(projectId); 
      fetchProjects(); // โหลดคะแนนใหม่ล่าสุดมาแสดง

    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsVoting(false);
    }
  };

  // --- Logic การคำนวณและแบ่งกลุ่ม ---
  
  const votingProjects = projects.filter((p) => p.status === "OPEN");
  const resultProjects = projects.filter((p) => p.status === "APPROVED" || p.status === "CLOSE");

  // คำนวณคะแนนรวม
  const calculateScore = (votes?: Partial<ProjectVote>[]) => {
    if (!votes || votes.length === 0) return 0;
    return votes.reduce((acc, curr) => acc + (curr.voteWeight || 0), 0);
  };

  // คำนวณ % (สมมติฐานเต็ม 100 คะแนน)
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
                      {/* แสดง Manager */}
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
                                ? "bg-[#F26522] hover:bg-orange-600 text-white shadow-none cursor-default" // ปุ่มที่เราเลือก
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none hover:bg-gray-200" // ปุ่มอื่นปิด
                            : "bg-[#F26522] shadow-md hover:shadow-orange-200 hover:-translate-y-0.5" // ยังไม่เลือก
                        }`}
                        disabled={!!userVotedId || isVoting}
                        onClick={() => handleVote(project.id, project.projectName)}
                      >
                        {userVotedId === project.id 
                          ? "คุณโหวตโครงการนี้แล้ว" 
                          : userVotedId 
                            ? "ใช้สิทธิ์ครบแล้ว" 
                            : isVoting 
                              ? "กำลังบันทึก..." 
                              : "โหวต"}
                      </PrimaryButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* --- Section 2: ผลพิจารณาโครงการ (Results) --- */}
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
    </div>
  );
}