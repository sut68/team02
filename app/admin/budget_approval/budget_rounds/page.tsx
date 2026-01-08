"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";

// Components UI
import { PrimaryButton } from "@/app/components/ui/Button";
import { InputIcon } from "@/app/components/ui/InputIcon";
import CreateBudgetRoundModal from "@/app/components/ui/CreateBudgetRoundModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/components/tables/Table";
import ConfirmModal from "@/app/components/ui/ConfirmModal"; 

// Types
import { BudgetRound } from "@/app/types/budget_approval";

export default function BudgetRoundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rounds, setRounds] = useState<BudgetRound[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State เก็บข้อมูลรอบที่จะแก้ไข (null = สร้างใหม่)
  const [editingRound, setEditingRound] = useState<BudgetRound | null>(null);

  // State Modal สำหรับ Action (PUBLISH หรือ DELETE)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'PUBLISH' | 'DELETE' | null;
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
      case 'OPEN': return 'bg-green-50 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
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
      if (round.status === 'OPEN') acc.active++;
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

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-4xl font-semibold text-gray-800">จัดการรอบงบประมาณ</h1>
          
          {/* ปุ่มย้อนกลับสไตล์เดียวกับปุ่มกู้คืน (History) */}
          <div className="flex gap-2 shrink-0">
            <Link
                href="/admin/budget_approval"
                className="h-10 px-6 rounded-lg flex items-center gap-2 transition-all border border-gray-200 bg-white text-gray-600 hover:bg-gray-50shadow-sm"
                title="กลับไปหน้าโครงการส่งพิจารณา"
            >
                <ArrowLeftToLine className="w-5 h-5" />
                <span className="text-sm font-medium">หน้าโครงการส่งพิจารณา</span>
            </Link>
          
            <PrimaryButton 
              onClick={handleCreate} 
              style={{ 
                borderRadius: "8px", 
                height: "40px", 
                paddingLeft: "24px", 
                paddingRight: "24px",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              <CirclePlus className="w-5 h-5 mr-2" />
              เพิ่มรอบการพิจารณา
            </PrimaryButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-gray-200">
              <Layers className="w-10 h-10 mx-auto text-gray-600 mb-3" />
              <h3 className="text-gray-600 font-medium">รอบทั้งหมด</h3>
              <p className="text-2xl font-bold text-gray-700">{stats.all} <span className="text-sm font-normal text-gray-400">รอบ</span></p>
            </div>
            <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-green-200">
              <CalendarDays className="w-10 h-10 mx-auto text-green-600 mb-3" />
              <h3 className="text-gray-600 font-medium">เปิดรับระดมทุนอยู่</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.active} <span className="text-sm font-normal text-gray-400">รอบ</span>
              </p>
            </div>
            <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-orange-200">
              <Users className="w-10 h-10 mx-auto text-orange-500 mb-3" />
              <h3 className="text-gray-600 font-medium">ยอดระดมทุนรวม</h3>
              <p className="text-2xl font-bold text-orange-500">
                {stats.totalDonated.toLocaleString()} <span className="text-sm font-normal text-gray-400">บาท</span>
              </p>
            </div>
        </div>

        {/* Toolbar Area */}
        <div className="w-full">
          <InputIcon
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อรอบ, ไตรมาส, หรือปีงบประมาณ..."
            className="w-full bg-white border-gray-200 rounded-lg h-12 shadow-sm"
          />
        </div>

        {/* Table Content */}
        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white p-4">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="font-semibold text-gray-600 py-4 pl-6">ชื่อรอบ/ไตรมาส</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">ปีงบประมาณ</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center w-[220px]">ช่วงเวลา</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">ยอดระดมทุน</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center w-40">สถานะ (Auto)</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center w-[120px]">Publish</TableHead>
                <TableHead className="font-semibold text-gray-600 text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rounds.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-80 text-center text-gray-400">กำลังโหลดข้อมูล...</TableCell></TableRow>
              ) : filteredRounds.length > 0 ? (
                filteredRounds.map((round) => (
                  <TableRow key={round.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium text-gray-700 py-4 pl-6">{round.roundName}</TableCell>
                    <TableCell className="text-center text-gray-600">{round.fiscalYear}</TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                        {round.startDate ? new Date(round.startDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'} 
                        <span className="mx-2 text-gray-400">-</span>
                        {round.endDate ? new Date(round.endDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-gray-600 font-medium">
                      {round.stats?.totalDonated.toLocaleString()} <span className="text-xs text-gray-400 font-normal">บาท</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(round.status)}`}>
                          {getStatusLabel(round.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={round.isPublished}
                                  disabled={updatingId === round.id}
                                  onChange={() => initiatePublishToggle(round.id, round.isPublished)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
                          </label>
                          <span className={`text-[10px] ${round.isPublished ? 'text-[#F26522]' : 'text-gray-400'}`}>
                              {round.isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                          </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => handleEdit(round)}
                          className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-all"
                        >
                          <PenLine size={18} strokeWidth={2} />
                        </button>
                        <span className="text-gray-300 font-light">|</span>
                        <button 
                          onClick={() => initiateDelete(round.id)} 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-80 text-center text-gray-400">
                    <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    ไม่พบข้อมูลรอบงบประมาณ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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