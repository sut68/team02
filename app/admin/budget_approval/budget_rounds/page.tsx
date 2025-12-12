"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Layers,       
  CalendarRange, 
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

interface BudgetRound {
  id: number;
  roundName: string;
  fiscalYear: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  stats?: {
    totalProposals: number;
    totalRequested: number;
    totalDonated: number;
    remaining: number;
  };
}

export default function BudgetRoundsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rounds, setRounds] = useState<BudgetRound[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State (ถ้าต้องการให้กดการ์ดแล้วกรองได้ในอนาคต)
  // const [activeFilter, setActiveFilter] = useState("ทั้งหมด");

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

  // --- คำนวณ Stats ---
  const stats = rounds.reduce(
    (acc, round) => {
      acc.all++;
      if (round.fiscalYear === "2568") acc.fy2568++;
      if (round.fiscalYear === "2567") acc.fy2567++;
      acc.totalDonated += round.stats?.totalDonated || 0;
      return acc;
    },
    { all: 0, fy2568: 0, fy2567: 0, totalDonated: 0 }
  );

  // --- ข้อมูลสำหรับการ์ด (Config) ---
  const statCards = [
    { 
      label: "รอบทั้งหมด", 
      count: stats.all, 
      unit: "รอบ",
      icon: Layers, 
      color: "text-orange-500", 
      border: "border-orange-200" 
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
        
        <div>
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

        {/* --- Summary Cards Section (แบบ Grid Loop ตามที่ขอ) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`cursor-pointer border-2 rounded-xl bg-white p-6 text-center hover:shadow-md transition-all ${card.border}`}
              >
                <div className="mb-4 flex justify-center">
                  <Icon className={`w-14 h-14 ${card.color}`} strokeWidth={1.3} />
                </div>
                <h3 className="text-base text-gray-700">{card.label}</h3>
                <p className={`text-2xl font-medium mt-2 ${card.color}`}>
                  {loading ? "..." : card.count}
                  {card.unit && <span className="text-sm text-gray-700 ml-1 font-normal">{card.unit}</span>}
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
                  <TableHead className="font-semibold text-gray-600 text-center w-[300px]">ช่วงเวลาระดมทุน (เริ่ม - สิ้นสุด)</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">ยอดระดมทุน (บาท)</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-80 text-center text-gray-400">
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
                         <div className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-md text-sm font-medium border border-orange-100">
                           {round.startDate ? new Date(round.startDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'} 
                           <span className="mx-2 text-gray-400">➜</span>
                           {round.endDate ? new Date(round.endDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit'}) : '-'}
                         </div>
                      </TableCell>
                      <TableCell className="text-center text-gray-600">
                        {(round.stats?.totalDonated || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                              className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-all"
                              onClick={() => alert(`ฟีเจอร์แก้ไข ID: ${round.id}`)}
                              title="แก้ไข"
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
                    <TableCell colSpan={5} className="h-80 text-center text-gray-400">
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