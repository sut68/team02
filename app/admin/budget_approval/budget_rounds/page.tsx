"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Layers,                  
  PenLine,
  Trash2,
  CirclePlus,
  ArrowLeftToLine,
  Send,
  Loader2,
  CalendarClock,
  Wallet,
  ChevronDown
} from "lucide-react";

// Components UI
import { Card, CardContent } from '@/app/components/ui/Card';
import CreateBudgetRoundModal from "@/app/components/ui/CreateBudgetRoundModal";
import ConfirmModal from "@/app/components/ui/ConfirmModal"; 
import SuccessModal from "@/app/components/ui/SuccessModal"; 

// Types
import { BudgetRound } from "@/app/types/budget_approval";
import { Table, TableHead, TableHeader, TableBody, TableCell, TableRow } from "@/app/components/tables/Table";

export default function BudgetRoundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rounds, setRounds] = useState<BudgetRound[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingRound, setEditingRound] = useState<BudgetRound | null>(null);

  // [เพิ่ม] State สำหรับ Alert Modal
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'SUCCESS',
    title: '',
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'PUBLISH' | 'DELETE' | 'SEND_EMAIL' | null;
    targetId: number | null;
    targetCurrentState?: boolean;
  }>({
    isOpen: false,
    action: null,
    targetId: null,
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/budget-round");
      if (res.ok) {
        const data = await res.json();
        setRounds(data.budgetRounds || []);
      }
    } catch (error) {
      console.error("Error fetching budget rounds:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const initiateDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      action: 'DELETE',
      targetId: id,
    });
  };

  const initiatePublishToggle = (id: number, nextState: boolean) => {
    setConfirmModal({
      isOpen: true,
      action: 'PUBLISH',
      targetId: id,
      targetCurrentState: nextState,
    });
  };

  const initiateSendEmail = (id: number) => {
    setConfirmModal({
        isOpen: true,
        action: 'SEND_EMAIL',
        targetId: id,
    });
  };

  // [เพิ่ม] ฟังก์ชันแสดง Alert
  const showAlert = (type: 'SUCCESS' | 'ERROR', title: string, message: string) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const handleConfirmAction = async () => {
    const { action, targetId, targetCurrentState } = confirmModal;
    if (targetId === null) return;

    setIsConfirming(true);
    setUpdatingId(targetId);

    try {
      if (action === 'DELETE') {
        const res = await fetch(`/api/budget-round?id=${targetId}`, { method: "DELETE" });
        if (res.ok) {
          fetchRounds();
          setConfirmModal({ isOpen: false, action: null, targetId: null });
          showAlert('SUCCESS', 'สำเร็จ', 'ลบรายการเรียบร้อยแล้ว');
        } else {
          showAlert('ERROR', 'ผิดพลาด', 'เกิดข้อผิดพลาดในการลบ');
        }
      } 
      else if (action === 'PUBLISH') {
        const newPublishState = targetCurrentState;
        const res = await fetch("/api/budget-round", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetId, isPublished: newPublishState }),
        });

        if (res.ok) {
          setRounds((prev) => 
            prev.map((r) => r.id === targetId ? { ...r, isPublished: !!newPublishState } : r)
          );
          await fetchRounds();
          setConfirmModal({ isOpen: false, action: null, targetId: null });
        } else {
          showAlert('ERROR', 'ผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ');
        }
      }
      else if (action === 'SEND_EMAIL') {
          const res = await fetch(`/api/project-vote/sent-vote-invite?roundId=${targetId}`, {
              method: 'POST'
          });
          const data = await res.json();
          
          if (res.ok) {
              setConfirmModal({ isOpen: false, action: null, targetId: null });
              showAlert('SUCCESS', 'ดำเนินการสำเร็จ', `${data.message}\n(Sent Count: ${data.sentCount || 0})`);
          } else {
              setConfirmModal({ isOpen: false, action: null, targetId: null });
              showAlert('ERROR', 'แจ้งเตือน', data.message || data.error);
          }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert('ERROR', 'ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsConfirming(false);
      setUpdatingId(null);
    }
  };

  const handleCreate = () => {
    setEditingRound(null);
    setIsModalOpen(true);
  };

  const handleEdit = (round: BudgetRound) => {
    setEditingRound(round);
    setIsModalOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-orange-100 text-orange-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'เปิดรับบริจาค';
      case 'CLOSED': return 'ปิดรอบแล้ว';
      default: return 'กำลังเตรียม';
    }
  };

  const stats = rounds.reduce(
    (acc, round) => {
      acc.all++;
      if (round.isPublished && round.status !== 'CLOSED') acc.active++;
      acc.totalDonated += round.stats?.totalDonated || 0;
      return acc;
    },
    { all: 0, active: 0, totalDonated: 0 }
  );

  const filteredRounds = rounds.filter(
    (r) =>
      r.roundName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.fiscalYear.includes(searchQuery)
  );

  const getModalContent = () => {
    if (confirmModal.action === 'DELETE') {
      return {
        title: "ยืนยันการลบ",
        message: "คุณแน่ใจหรือไม่ที่จะลบรายการนี้? \nการกระทำนี้ไม่สามารถย้อนกลับได้",
        confirmLabel: "ลบรายการ",
        isDanger: true
      };
    }
    if (confirmModal.action === 'SEND_EMAIL') {
        return {
            title: "ยืนยันการส่งอีเมลแจ้งเตือน",
            message: "ระบบจะทำการส่งอีเมลหาผู้ที่มีสิทธิ์โหวต (Alumni ที่บริจาคแล้ว) ในรอบนี้ทุกคน\n\n(ระบบจะตรวจสอบวันเปิดโหวต 15 วันสุดท้ายก่อนส่งจริง)",
            confirmLabel: "ยืนยันส่งอีเมล",
            isDanger: false
        };
    }

    const isPublishing = confirmModal.targetCurrentState;
    return {
      title: isPublishing ? "ยืนยันการเผยแพร่" : "ยืนยันการยกเลิกเผยแพร่",
      message: isPublishing 
        ? "คุณต้องการเปิดสถานะ \"เผยแพร่ (Publish)\" หรือไม่?\n\nระบบจะคำนวณสถานะ (Open/Closed) ตามวันเริ่มต้น-สิ้นสุดให้อัตโนมัติ"
        : "คุณต้องการปิดสถานะกลับเป็น \"ฉบับร่าง (Draft)\" หรือไม่?\n\nผู้ใช้งานทั่วไปจะไม่เห็นรอบงบประมาณนี้",
      confirmLabel: isPublishing ? "ยืนยันการเผยแพร่" : "เปลี่ยนเป็นฉบับร่าง",
      isDanger: !isPublishing
    };
  };

  const modalContent = getModalContent();

  if (loading && rounds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500">กำลังโหลดข้อมูลรอบงบประมาณ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">จัดการรอบงบประมาณ</h1>
          
          <div className="flex gap-3">
            <Link href="/admin/budget_approval">
                <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition shadow-sm">
                    <ArrowLeftToLine className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">หน้าโครงการ</span>
                </button>
            </Link>
          
            <button 
                onClick={handleCreate}
                className="flex items-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition shadow-sm"
            >
              <CirclePlus className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">เพิ่มรอบการพิจารณา</span>
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-orange-100 bg-white">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <Layers className="w-16 h-16 text-orange-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-normal text-gray-700">รอบทั้งหมด</h3>
                    <p className="text-2xl font-medium text-gray-800 mt-2">{stats.all} <span className="text-sm text-gray-400">รอบ</span></p>
                </CardContent>
            </Card>

            <Card className="border-2 border-orange-300 bg-orange-50 shadow-sm">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <CalendarClock className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-normal text-orange-800">เปิดรับระดมทุนอยู่</h3>
                    <p className="text-2xl font-bold text-orange-600 mt-2">{stats.active} <span className="text-sm font-normal opacity-80">รอบ</span></p>
                </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 bg-white">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <Wallet className="w-16 h-16 text-orange-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-normal text-gray-700">ยอดระดมทุนรวม</h3>
                    <p className="text-2xl font-medium text-gray-800 mt-2">{stats.totalDonated.toLocaleString()} <span className="text-sm text-gray-400">บาท</span></p>
                </CardContent>
            </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
            <CardContent className="p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อรอบ, ไตรมาส, หรือปีงบประมาณ..."
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm transition"
                    />
                </div>
            </CardContent>
        </Card>

        {/* Table Content */}
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100 hover:bg-gray-100">
                            <TableHead className="w-[200px] text-gray-600">ชื่อรอบ/ไตรมาส</TableHead>
                            <TableHead className="text-center text-gray-600">ปีงบประมาณ</TableHead>
                            <TableHead className="text-center text-gray-600">ช่วงเวลา</TableHead>
                            <TableHead className="text-center text-gray-600">ยอดระดมทุน</TableHead>
                            <TableHead className="text-center text-gray-600">สถานะ (Auto)</TableHead>
                            <TableHead className="text-center text-gray-600">Publish</TableHead>
                            <TableHead className="text-center text-gray-600">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRounds.length > 0 ? (
                            filteredRounds.map((round) => (
                                <TableRow key={round.id}>
                                    <TableCell className="font-medium text-gray-800">
                                        {round.roundName}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">
                                        {round.fiscalYear}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <span>
                                                {round.startDate ? new Date(round.startDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                                            </span>
                                            <span className="text-xs text-gray-400">ถึง</span>
                                            <span>
                                                {round.endDate ? new Date(round.endDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-gray-800">
                                        {round.stats?.totalDonated.toLocaleString()} <span className="text-xs font-normal text-gray-400">บาท</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(round.status)}`}>
                                            {getStatusLabel(round.status)}
                                        </span>
                                    </TableCell>
                                    
                                    {/* --- ใช้ Dropdown Style แบบ UserManagement --- */}
                                    <TableCell className="text-center">
                                      <div className="relative inline-block">
                                        <select
                                          value={round.isPublished ? 'published' : 'draft'}
                                          disabled={updatingId === round.id}
                                          onChange={(e) =>
                                            initiatePublishToggle(
                                              round.id,
                                              e.target.value === 'published'
                                            )
                                          }
                                          className={`
                                            w-[110px] appearance-none px-3 py-1 pr-6 rounded-full text-xs font-medium border-0 outline-none transition-colors cursor-pointer text-center
                                            ${updatingId === round.id ? 'opacity-50 cursor-not-allowed' : ''}
                                            ${round.isPublished 
                                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }
                                          `}
                                        >
                                          <option value="draft">ฉบับร่าง</option>
                                          <option value="published">เผยแพร่แล้ว</option>
                                        </select>
                                        
                                        <ChevronDown
                                          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 
                                            ${round.isPublished ? 'text-orange-700' : 'text-gray-700'}
                                          `}
                                        />
                                      </div>
                                    </TableCell>
                                    {/* ------------------------------------------- */}

                                    <TableCell className="text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button
                                                onClick={() => initiateSendEmail(round.id)}
                                                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition"
                                                title="ส่งอีเมลเชิญโหวต"
                                            >
                                                <Send size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(round)}
                                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition"
                                                title="แก้ไข"
                                            >
                                                <PenLine size={16} />
                                            </button>
                                            <button
                                                onClick={() => initiateDelete(round.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                title="ลบ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Layers className="w-12 h-12 text-gray-300 mb-4" />
                                        ไม่พบข้อมูลรอบงบประมาณที่ตรงกับการค้นหา
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <CreateBudgetRoundModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchRounds()} 
        initialData={editingRound}
      />

      {/* Confirm Modal (Yes/No) */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => !isConfirming && setConfirmModal({ ...confirmModal, isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={modalContent.title}
        message={modalContent.message}
        confirmLabel={modalContent.confirmLabel}
        isDanger={modalContent.isDanger}
        isLoading={isConfirming}
      />

      {/* Alert Modal (Error/Success with 1 button) */}
      {alertModal.type === 'SUCCESS' ? (
          <SuccessModal 
             show={alertModal.isOpen}
             message={alertModal.message}
             onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          />
      ) : (
          <ConfirmModal 
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            title={alertModal.title}
            message={alertModal.message}
            confirmLabel="ตกลง"
            cancelLabel="" 
            isDanger={true}
          />
      )}
    </div>
  );
}