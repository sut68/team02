"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Layers,        
  CalendarDays, 
  Users,        
  ChevronLeft,
  PenLine,
  Trash2,
  CirclePlus
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
  
  // State สำหรับ Modal ยืนยัน
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetId: number | null;
    targetCurrentState: boolean; 
  }>({
    isOpen: false,
    targetId: null,
    targetCurrentState: false,
  });

  // State สำหรับ Loading ขณะกดยืนยันใน Modal
  const [isConfirming, setIsConfirming] = useState(false);

  // State สำหรับปิดการกดปุ่มอื่นในตารางขณะโหลด
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

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;
    try {
      const res = await fetch(`/api/budget-round?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRounds();
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // 1. ฟังก์ชันเริ่มกดสวิตช์ (เปิด Modal)
  const initiatePublishToggle = (id: number, currentPublishState: boolean) => {
    setConfirmModal({
      isOpen: true,
      targetId: id,
      targetCurrentState: currentPublishState,
    });
  };

  // 2. ฟังก์ชันยืนยันจริงๆ (ยิง API)
  const handleConfirmPublish = async () => {
    const { targetId, targetCurrentState } = confirmModal;
    if (targetId === null) return;

    setIsConfirming(true);
    setUpdatingId(targetId); // ล็อก UI แถวนั้น
    const newPublishState = !targetCurrentState;

    try {
      const res = await fetch("/api/budget-round", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, isPublished: newPublishState }),
      });

      if (res.ok) {
        // อัปเดต State UI ทันที
        setRounds((prev) => 
          prev.map((r) => r.id === targetId ? { ...r, isPublished: newPublishState } : r)
        );
        await fetchRounds();
        setConfirmModal({ isOpen: false, targetId: null, targetCurrentState: false });
      } else {
        alert("อัปเดตสถานะไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsConfirming(false);
      setUpdatingId(null);
    }
  };

  // Styles
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

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="mt-4">
          <Link 
            href="/admin/budget_approval" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#F26522] transition-colors group font-medium"
          >
            <ChevronLeft size={18} className="text-gray-400 group-hover:text-[#F26522] group-hover:-translate-x-1 transition-transform duration-200" />
            ย้อนกลับไปหน้าโครงการส่งพิจารณา
          </Link>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-medium text-gray-700">จัดการรอบงบประมาณ</h1>
          </div>
          <PrimaryButton 
            onClick={() => setIsModalOpen(true)}
            style={{ borderRadius: "8px", height: "40px", paddingLeft: "24px", paddingRight: "24px" }}
          >
            <CirclePlus className="w-5 h-5 mr-2" />
            เพิ่มรอบงบประมาณ
          </PrimaryButton>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-gray-200">
             <Layers className="w-10 h-10 mx-auto text-gray-600 mb-3" />
             <h3 className="text-gray-600">รอบทั้งหมด</h3>
             <p className="text-2xl font-semibold text-gray-600">{stats.all} <span className="text-sm font-normal">รอบ</span></p>
           </div>
           <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-green-200">
             <CalendarDays className="w-10 h-10 mx-auto text-green-600 mb-3" />
             <h3 className="text-gray-600">เปิดรับระดมทุนอยู่</h3>
             <p className="text-2xl font-semibold text-green-600">{stats.active} <span className="text-sm font-normal">รอบ</span></p>
           </div>
           <div className="border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all border-orange-200">
             <Users className="w-10 h-10 mx-auto text-orange-500 mb-3" />
             <h3 className="text-gray-600">ยอดระดมทุนรวม</h3>
             <p className="text-2xl font-semibold text-orange-500">{stats.totalDonated.toLocaleString()} <span className="text-sm font-normal">บาท</span></p>
           </div>
        </div>

        {/* Table Content */}
        <div className="space-y-4">
          <div className="w-full">
            <InputIcon
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อรอบ, ไตรมาส, หรือปีงบประมาณ..."
              className="w-full bg-white border-gray-200 rounded-lg h-12"
            />
          </div>

          <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white p-4">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600 py-4 pl-6">ชื่อรอบ/ไตรมาส</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">ปีงบประมาณ</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center w-[220px]">ช่วงเวลา</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">ยอดระดมทุน</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center w-[160px]">สถานะ (Auto)</TableHead>
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
                      
                      {/* Auto Status */}
                      <TableCell className="text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(round.status)}`}>
                            {getStatusLabel(round.status)}
                        </span>
                      </TableCell>

                      {/* Publish Switch */}
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
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
                            </label>
                            <span className={`text-[10px] ${round.isPublished ? 'text-[#F26522]' : 'text-gray-400'}`}>
                                {round.isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                            </span>
                         </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-all">
                            <PenLine size={18} strokeWidth={2} />
                          </button>
                          <span className="text-gray-300 font-light">|</span>
                          <button onClick={() => handleDelete(round.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all">
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
      </div>

      <CreateBudgetRoundModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchRounds()} 
      />

      {/* ✅ ใช้ Component ConfirmModal ที่ Import มา */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => !isConfirming && setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmPublish}
        title={!confirmModal.targetCurrentState ? "ยืนยันการเผยแพร่" : "ยืนยันการยกเลิกเผยแพร่"}
        message={!confirmModal.targetCurrentState 
            ? "คุณต้องการเปิดสถานะ \"เผยแพร่ (Publish)\" หรือไม่?\n\nระบบจะคำนวณสถานะ (Open/Closed) ตามวันเริ่มต้น-สิ้นสุดให้อัตโนมัติ และผู้ใช้งานทั่วไปจะสามารถมองเห็นรอบงบประมาณนี้ได้"
            : "คุณต้องการปิดสถานะกลับเป็น \"ฉบับร่าง (Draft)\" หรือไม่?\n\nผู้ใช้งานทั่วไปจะไม่เห็นรอบงบประมาณนี้ และระบบจะหยุดรับคำร้องทันที"
        }
        confirmLabel={!confirmModal.targetCurrentState ? "ยืนยันการเผยแพร่" : "เปลี่ยนเป็นฉบับร่าง"}
        isDanger={confirmModal.targetCurrentState}
        isLoading={isConfirming}
      />
    </div>
  );
}