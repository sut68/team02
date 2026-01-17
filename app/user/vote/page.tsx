"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { PrimaryButton } from "@/app/components/ui/Button";
import { Card, CardContent, CardFooter } from "@/app/components/ui/Card";
import { Loader2, Building2, Coins, User, CheckCircle2, HeartHandshake } from "lucide-react";
import { ProjectWithManager, ProjectVote } from "@/app/types/budget_approval";

// UI Modal
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import SuccessModal from "@/app/components/ui/SuccessModal";

// --- Utility: คำนวณปีงบประมาณไทยปัจจุบัน ---
const getCurrentFiscalYear = () => {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const year = today.getFullYear() + 543; // แปลงเป็น พ.ศ.
  return month >= 10 ? year + 1 : year;
};

export default function VotePage() {
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State: สถานะการโหวต
  const [userVotedId, setUserVotedId] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState<number>(100);

  // State: Modals
  const [targetProject, setTargetProject] = useState<{id: number, name: string} | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'CONFIRM' | 'SUCCESS' | 'ERROR' | null;
    message?: string;
    title?: string;
  }>({ type: null });

  // 1. Fetch Data
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/project-proposal"); 
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await res.json();
      
      setProjects(data.proposals || []);
      
      if (data.totalVoters && data.totalVoters > 0) {
          setTotalVoters(data.totalVoters);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);

  const fetchUserVoteStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/project-vote"); 
      if (res.ok) {
        const data = await res.json();
        setCanVote(data.canVote); 
        if (data.voted) {
          setUserVotedId(data.votedProjectId);
        } else {
          setUserVotedId(null);
        }
        if (data.activeRoundId) {
            setActiveRoundId(data.activeRoundId);
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
  const handleVoteClick = (projectId: number, projectName: string) => {
    if (userVotedId) return; 
    setTargetProject({ id: projectId, name: projectName });
    setModalState({ type: 'CONFIRM' });
  };

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
      if (!res.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการโหวต");

      setModalState({ 
        type: 'SUCCESS', 
        message: "ขอบคุณสำหรับการโหวต! คะแนนของคุณถูกบันทึกเรียบร้อยแล้ว" 
      });
      
      setUserVotedId(targetProject.id); 
      fetchProjects(); 

    } catch (err: any) {
      setModalState({
        type: 'ERROR',
        title: "ไม่สามารถโหวตได้",
        message: err.message
      });
    } finally {
      setIsVoting(false);
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
    if (modalState.type !== 'CONFIRM') {
        setTargetProject(null);
    }
  };

  // --- Logic ---
  const votingProjects = projects.filter((p) => p.status === "OPEN");
  const currentFiscalYear = getCurrentFiscalYear();

  // 1. กรองโครงการที่จบแล้ว (เฉพาะ APPROVED)
  const pastProjects = projects.filter((p) => {
    const isApproved = p.status === "APPROVED";
    // @ts-ignore
    const projectFiscalYear = p.budgetRound?.fiscalYear || p.budgetRound?.year; 
    const isCurrentYear = projectFiscalYear ? Number(projectFiscalYear) === currentFiscalYear : true;
    return isApproved && isCurrentYear;
  });

  // 2. Helper คำนวณคะแนน
  const calculateScore = (votes?: Partial<ProjectVote>[]) => {
    if (!votes || votes.length === 0) return 0;
    return votes.reduce((acc, curr) => acc + (curr.voteWeight || 0), 0);
  };

  const calculatePercentage = (votes?: Partial<ProjectVote>[]) => {
    const score = calculateScore(votes);
    const percent = (score / totalVoters) * 100;
    return Math.min(percent, 100).toFixed(1); 
  };

  // 3. จัดกลุ่มตามรอบ (Round) และเรียงลำดับคะแนน
  const groupedRounds = pastProjects.reduce((acc, project) => {
    const roundId = project.budgetRound?.id || 0;
    const roundName = project.budgetRound?.roundName || `รอบงบประมาณ (ID: ${roundId})`; 

    if (!acc[roundId]) {
      acc[roundId] = {
        id: roundId,
        name: roundName,
        projects: []
      };
    }
    acc[roundId].projects.push(project);
    return acc;
  }, {} as Record<number, { id: number, name: string, projects: ProjectWithManager[] }>);

  // เรียง Projects ในแต่ละรอบ ตามคะแนนจากมากไปน้อย
  Object.values(groupedRounds).forEach(round => {
    round.projects.sort((a, b) => {
        const scoreA = calculateScore(a.votes);
        const scoreB = calculateScore(b.votes);
        return scoreB - scoreA;
    });
  });

  const sortedRounds = Object.values(groupedRounds).sort((a, b) => b.id - a.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-orange-500" /> กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
      
      {/* --- Hero Section --- */}
      <section className="relative w-full h-[300px] md:h-[400px] overflow-hidden mb-12 bg-gray-800">
        <Image
          src="/budget/covers/12.jpg"
          alt="Banner พิจารณาโครงการ"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-end p-8 md:p-16">
            <h1 className="text-white text-3xl md:text-5xl font-bold text-right shadow-lg">
              พิจารณาโครงการ
            </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8">
        
        {/* --- Section 1: Voting Projects --- */}
        <div className="mb-20">
          <div className="relative w-full mb-8 border-b border-gray-200 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    โครงการที่เปิดให้โหวต
                </h2>
                <div className="text-md text-gray-500">
                    สถานะ:{" "}
                    <span
                        className={`font-semibold ${
                        votingProjects.length > 0 ? "text-orange-600" : "text-gray-500"
                        }`}
                    >
                        {votingProjects.length > 0 ? "เปิดรับคะแนน" : "ปิดรับคะแนน"}
                    </span>
                </div>
            </div>

            {/* ปุ่ม CTA ไปบริจาค */}
            {!canVote && activeRoundId && votingProjects.length > 0 && (
                <div className="my-4 md:ml-auto flex items-center gap-3 bg-orange-50 text-orange-800 px-4 py-3 rounded-lg border border-orange-100 shadow-xs gap-4">
                    <div className="bg-orange-100 p-2 rounded-full">
                        <HeartHandshake className="w-5 h-5"/>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">ท่านยังไม่มีสิทธิ์โหวต</p>
                        <p className="text-xs opacity-80">กรุณาร่วมบริจาคในรอบงบประมาณนี้ก่อน</p>
                    </div>
                    <Link href={`/user/donation`}>
                        <span className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-md transition-colors font-semibold cursor-pointer block">
                            ไปบริจาค
                        </span>
                    </Link>
                </div>
            )}
          </div>

          {votingProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
              ขณะนี้ยังไม่มีโครงการที่เปิดให้โหวต
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {votingProjects.map((project) => (
                
                <Card 
                    key={project.id} 
                    className="p-4 border-none shadow-sm bg-white w-full h-full flex flex-col relative transition-all hover:shadow-md"
                >
                  <div className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden group z-10 bg-gray-100 shrink-0">
                    {project.coverFilePath ? (
                      <Image
                        src={project.coverFilePath}
                        alt={project.projectName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                        <Building2 className="w-8 h-8 opacity-20"/>
                        <span>ไม่มีรูปภาพ</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-0 mb-6 grow flex flex-col">
                    <h3 
                      className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight" 
                      title={project.projectName}
                    >
                      {project.projectName}
                    </h3>
                    
                    <div className="space-y-1.5 text-sm text-gray-500 font-light mt-auto">
                        <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{project.responsibilityUnit || "-"}</span>
                        </div>
                        {project.manager && (
                            <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">
                                    {project.manager.firstName} {project.manager.lastName}
                                </span>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <Coins className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{project.requestedAmount?.toLocaleString() || 0} บาท</span>
                        </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-0 flex justify-end gap-2 mt-auto shrink-0">
                    <PrimaryButton
                        className={`h-10 px-6 rounded-lg text-base font-medium shadow-sm transition-all flex items-center justify-center gap-2 w-[140px]
                        ${
                          userVotedId
                            ? userVotedId === project.id 
                              ? "bg-orange-600 hover:bg-orange-700 text-white cursor-default" 
                              : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : canVote 
                              ? "bg-[#F26522] hover:bg-[#d54e10] text-white hover:-translate-y-0.5" 
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={!!userVotedId || isVoting || (!canVote && !userVotedId)}
                        onClick={() => {
                            if (!canVote && !userVotedId) {
                                setModalState({
                                    type: 'ERROR',
                                    title: "ไม่มีสิทธิ์",
                                    message: "กรุณาร่วมบริจาคในรอบงบประมาณนี้ก่อนทำการโหวต"
                                });
                                return;
                            }
                            handleVoteClick(project.id, project.projectName);
                        }}
                    >
                        {userVotedId === project.id ? (
                            <>
                                <CheckCircle2 className="w-5 h-5"/> โหวตแล้ว
                            </>
                        ) : userVotedId ? (
                            "ใช้สิทธิ์แล้ว"
                        ) : isVoting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : canVote ? (
                            "โหวต" 
                        ) : (
                            "ไม่มีสิทธิ์"
                        )}
                    </PrimaryButton>
                  </CardFooter>
                </Card>

              ))}
            </div>
          )}
        </div>

        {/* --- Section 2: Result (Show All Rounds in Current Fiscal Year) --- */}
        <div>
          <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
             <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
               ผลพิจารณาโครงการ
             </h2>
             <span className="text-sm text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
                ประจำปีงบประมาณ {currentFiscalYear}
             </span>
          </div>

          {sortedRounds.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
               ยังไม่มีผลการพิจารณาโครงการในปีงบประมาณ {currentFiscalYear}
            </div>
          ) : (
            <div className="space-y-12">
              {sortedRounds.map((round) => (
                <div key={round.id} className="relative mb-8 last:mb-0">
                  
                  <div className="flex items-center gap-2 mb-4 sticky top-0 bg-gray-50/95 py-3 z-10 backdrop-blur-sm">
                    <h3 className="text-xl font-medium text-gray-700">
                      {round.name}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {round.projects.map((project, index) => {
                      const percentage = calculatePercentage(project.votes);
                      return (
                        <div 
                          key={project.id} 
                          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden"
                        >
                          
                          {index < 3 && (
                             <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold text-white
                                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'}
                             `}>
                                อันดับ {index + 1}
                             </div>
                          )}

                          <div className="relative w-full sm:w-40 h-40 sm:h-28 shrink-0 bg-gray-100 rounded-xl overflow-hidden">
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
                            <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-800">{project.projectName}</h3>
                              <div className="self-start md:self-center px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-orange-100 text-orange-700">
                                  <CheckCircle2 className="w-3 h-3"/>
                                  อนุมัติ
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-3">
                               หน่วยงาน: {project.responsibilityUnit} | งบ: {project.requestedAmount?.toLocaleString()}
                            </p>

                            <div className="flex items-center gap-4">
                               <div className="grow bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                  <div 
                                      className="h-2.5 rounded-full transition-all duration-1000 bg-[#F26522]"
                                      style={{ width: `${Math.min(Number(percentage), 100)}%` }} 
                                  />
                               </div>
                               <span className="text-sm font-bold text-gray-600 w-12 text-right">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

      <SuccessModal 
        show={modalState.type === 'SUCCESS'}
        message={modalState.message}
        onClose={closeModal}
      />

      <ConfirmModal 
        isOpen={modalState.type === 'ERROR'}
        onClose={closeModal}
        onConfirm={closeModal} 
        title={modalState.title || "แจ้งเตือน"}
        message={modalState.message || "เกิดข้อผิดพลาด"}
        confirmLabel="ตกลง"
        cancelLabel="" 
        isDanger={true} 
      />

    </div>
  );
}