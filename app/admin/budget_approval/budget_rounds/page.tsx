"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Layers,         
  CalendarDays, 
  Users,         
  PenLine,
  Trash2,
  CirclePlus,
  ArrowLeftToLine,
  Send,
  Loader2,
  CalendarClock,
  Wallet
} from "lucide-react";

// Components UI (ใช้ Card แบบหน้าอื่น)
import { Card, CardContent } from '@/app/components/ui/Card';
import CreateBudgetRoundModal from "@/app/components/ui/CreateBudgetRoundModal";
import ConfirmModal from "@/app/components/ui/ConfirmModal"; 

// Types
import { BudgetRound } from "@/app/types/budget_approval";

export default function BudgetRoundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rounds, setRounds] = useState<BudgetRound[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingRound, setEditingRound] = useState<BudgetRound | null>(null);

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

  const initiatePublishToggle = (id: number, currentPublishState: boolean) => {
    setConfirmModal({
      isOpen: true,
      action: 'PUBLISH',
      targetId: id,
      targetCurrentState: currentPublishState,
    });
  };

  const initiateSendEmail = (id: number) => {
    setConfirmModal({
        isOpen: true,
        action: 'SEND_EMAIL',
        targetId: id,
    });
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
        } else {
          alert("เกิดข้อผิดพลาดในการลบ");
        }
      } 
      else if (action === 'PUBLISH') {
        const newPublishState = !targetCurrentState;
        const res = await fetch("/api/budget-round", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetId, isPublished: newPublishState }),
        });

        if (res.ok) {
          setRounds((prev) => 
            prev.map((r) => r.id === targetId ? { ...r, isPublished: newPublishState } : r)
          );
          await fetchRounds();
          setConfirmModal({ isOpen: false, action: null, targetId: null });
        } else {
          alert("อัปเดตสถานะไม่สำเร็จ");
        }
      }
      else if (action === 'SEND_EMAIL') {
          const res = await fetch(`/api/project-vote/sent-vote-invite?roundId=${targetId}`, {
              method: 'POST'
          });
          const data = await res.json();
          
          if (res.ok) {
              alert(`ดำเนินการสำเร็จ: ${data.message}\n(Sent Count: ${data.sentCount || 0})`);
              setConfirmModal({ isOpen: false, action: null, targetId: null });
          } else {
              alert(`แจ้งเตือน: ${data.message || data.error}`);
              setConfirmModal({ isOpen: false, action: null, targetId: null });
          }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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

    const isPublishing = !confirmModal.targetCurrentState;
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
      // เอา bg-gray-50 ออกจาก Loading state
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500">กำลังโหลดข้อมูลรอบงบประมาณ...</p>
        </div>
      </div>
    );
  }

  return (
    // เอา bg-gray-50 ออกจาก Main container
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">จัดการรอบงบประมาณ</h1>
          
          <div className="flex gap-3">
            <Link
                href="/admin/budget_approval"
            >
                <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition shadow-sm">
                    <ArrowLeftToLine className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">หน้าโครงการ</span>
                </button>
            </Link>
          
            <button 
                onClick={handleCreate}
                className="flex items-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition shadow-sm"
            >
              <CirclePlus className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">เพิ่มรอบการพิจารณา</span>
            </button>
          </div>
        </div>

        {/* Dashboard Cards (Style: User Management) */}
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
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ชื่อรอบ/ไตรมาส</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">ปีงบประมาณ</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">ช่วงเวลา</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">ยอดระดมทุน</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">สถานะ (Auto)</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">Publish</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">จัดการ</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {filteredRounds.length > 0 ? (
                            filteredRounds.map((round) => (
                            <tr key={round.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{round.roundName}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-600">{round.fiscalYear}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span>{round.startDate ? new Date(round.startDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'}</span>
                                        <span className="text-xs text-gray-400">ถึง</span>
                                        <span>{round.endDate ? new Date(round.endDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-800">
                                {round.stats?.totalDonated.toLocaleString()} <span className="text-xs font-normal text-gray-400">บาท</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(round.status)}`}>
                                        {getStatusLabel(round.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={round.isPublished}
                                                disabled={updatingId === round.id}
                                                onChange={() => initiatePublishToggle(round.id, round.isPublished)}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                        <span className={`text-[10px] font-medium ${round.isPublished ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {round.isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
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
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                    ไม่พบข้อมูลรอบงบประมาณ
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </div>

      <CreateBudgetRoundModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchRounds()} 
        initialData={editingRound}
      />

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
    </div>
  );
}