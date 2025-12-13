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
  CirclePlus,
  ChevronDown,
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

// Types
import { BudgetRound } from "@/app/types/budget_approval";

export default function BudgetRoundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rounds, setRounds] = useState<BudgetRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null); // State สำหรับ loading ตอนแก้สถานะ

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

  // ✅ 2. ฟังก์ชันอัปเดตสถานะ
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/budget-round", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        // อัปเดต State ใน Frontend ทันทีเพื่อให้ UI ลื่นไหล
        setRounds((prev) => 
          prev.map((r) => r.id === id ? { ...r, status: newStatus as any } : r)
        );
      } else {
        alert("อัปเดตสถานะไม่สำเร็จ");
        fetchRounds(); // Re-fetch ถ้าพลาด
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper สำหรับสีของสถานะ
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-50 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'PREPARING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  // Helper สำหรับสีไอคอน
  const getIconColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-green-700';      // สีเขียวเข้ม
      case 'CLOSED': return 'text-gray-500';     // สีเทา
      case 'PREPARING': return 'text-yellow-700'; // สีเหลืองเข้ม
      default: return 'text-gray-400';
    }
  };

  // --- คำนวณ Stats ---
  const stats = rounds.reduce(
    (acc, round) => {
      acc.all++;
      if (round.status === 'OPEN') acc.active++; // นับรอบที่เปิดอยู่
      acc.totalDonated += round.stats?.totalDonated || 0;
      return acc;
    },
    { all: 0, active: 0, totalDonated: 0 }
  );

  // --- ข้อมูลสำหรับการ์ด (Config) ---
  const statCards = [
    { 
      label: "รอบทั้งหมด", 
      count: stats.all, 
      unit: "รอบ",
      icon: Layers, 
      color: "text-gray-600", 
      border: "border-gray-200" 
    },
    { 
      label: "เปิดรับระดมทุนอยู่", // เปลี่ยนให้มีความหมายมากขึ้น
      count: stats.active, 
      unit: "รอบ",
      icon: CalendarDays, 
      color: "text-green-600", 
      border: "border-green-200" 
    },
    { 
      label: "ยอดระดมทุนรวม", 
      count: stats.totalDonated.toLocaleString(), 
      unit: "บาท",
      icon: Users, 
      color: "text-orange-500", 
      border: "border-orange-200" 
    },
  ];

  const filteredRounds = rounds.filter(
    (r) =>
      r.roundName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.fiscalYear.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="mt-4">
          <Link 
            href="/admin/budget_approval" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#F26522] transition-colors group font-medium"
          >
            <ChevronLeft 
              size={18} 
              className="text-gray-400 group-hover:text-[#F26522] group-hover:-translate-x-1 transition-transform duration-200" 
            />
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

        {/* --- Summary Cards Grid (3 cards now) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`cursor-pointer border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all ${card.border}`}
              >
                <div className="mb-4 flex justify-center">
                  <Icon className={`w-12 h-12 ${card.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-base text-gray-600">{card.label}</h3>
                <p className={`text-2xl font-semibold mt-2 ${card.color}`}>
                  {loading ? "..." : card.count}
                  {card.unit && <span className="text-sm text-gray-500 ml-1 font-normal">{card.unit}</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* --- Content Area --- */}
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
                  <TableHead className="font-semibold text-gray-600 text-center w-[250px]">ช่วงเวลาระดมทุน</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">ยอดระดมทุน</TableHead>
                  {/* ✅ เพิ่ม Header สถานะ */}
                  <TableHead className="font-semibold text-gray-600 text-center w-[180px]">สถานะ</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rounds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-80 text-center text-gray-400">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filteredRounds.length > 0 ? (
                  filteredRounds.map((round) => (
                    <TableRow key={round.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-700 py-4 pl-6">
                        {round.roundName}
                      </TableCell>
                      <TableCell className="text-center text-gray-600">
                        {round.fiscalYear}
                      </TableCell>
                      <TableCell className="text-center">
                          <div className="text-sm text-gray-600">
                           {round.startDate ? new Date(round.startDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'} 
                           <span className="mx-2 text-gray-400">-</span>
                           {round.endDate ? new Date(round.endDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'}
                          </div>
                      </TableCell>
                      <TableCell className="text-center text-gray-600 font-medium">
                        {(round.stats?.totalDonated || 0).toLocaleString()} <span className="text-xs text-gray-400 font-normal">บาท</span>
                      </TableCell>
                      
                      {/* ✅ Cell สำหรับเลือกสถานะ */}
                      <TableCell className="text-center">
                        <div className="relative inline-block w-full max-w-[120px]">
                          <select
                            value={round.status}
                            disabled={updatingId === round.id}
                            onChange={(e) => handleStatusChange(round.id, e.target.value)}
                            className={`
                              appearance-none w-full px-3 py-1.5 pr-8 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all text-center
                              ${getStatusStyle(round.status)}
                              ${updatingId === round.id ? 'opacity-50 cursor-wait' : ''}
                            `}
                          >
                            <option value="PREPARING">กำลังเตรียม</option>
                            <option value="OPEN">เปิดรับบริจาค</option>
                            <option value="CLOSED">ปิดรอบแล้ว</option>
                          </select>
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70 ${getIconColor(round.status)}`}>
                            <ChevronDown size={14} strokeWidth={2.0} />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                              className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-all"
                              onClick={() => alert(`ฟีเจอร์แก้ไข ID: ${round.id}`)}
                              title="แก้ไขรายละเอียด"
                          >
                              <PenLine size={18} strokeWidth={2} />
                          </button>
                          <span className="text-gray-300 font-light">|</span>
                          <button 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                              onClick={() => handleDelete(round.id)}
                              title="ลบ"
                          >
                              <Trash2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-80 text-center text-gray-400">
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
    </div>
  );
}