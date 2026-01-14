"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, AlertCircle, FolderOpen, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import { PrimaryButton } from "@/app/components/ui/Button";
import { BudgetRound } from "@/app/types/budget_approval";
import { BudgetReport } from "@/app/types/budget_report";

const PLACEHOLDER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect fill='%23f1f5f9' width='800' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='30' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// Types
type ChartDataItem = {
  name: string;
  value: number;
  color: string;
};

// Pie Label
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  } = props;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-lg font-bold drop-shadow-md"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Page Component
export default function BudgetReportPage() {
  const currentThaiYear = (new Date().getFullYear() + 543).toString();
  const [years, setYears] = useState<string[]>([]);
  const [year, setYear] = useState(currentThaiYear);
  const [loading, setLoading] = useState(true);
  const [budgetRounds, setBudgetRounds] = useState<BudgetRound[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  
  const [reports, setReports] = useState<(BudgetReport & { imageSrc?: string })[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Available Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/budget-round");
        let availableYears: string[] = [];

        if (res.ok) {
            const data = await res.json();
            const rounds: BudgetRound[] = data.budgetRounds || [];
            setBudgetRounds(rounds);
            availableYears = Array.from(new Set(
                rounds
                    .map(r => r.fiscalYear)
                    .filter((y): y is string => !!y)
            ));
        }

        // --- แก้ไข: ลบ logic การเพิ่ม nextYear ออก ---
        // ตรวจสอบแค่ currentThaiYear ว่ามีหรือยัง ถ้าไม่มีให้เพิ่มเข้าไป
        if (!availableYears.includes(currentThaiYear)) {
            availableYears.push(currentThaiYear);
        }

        availableYears.sort((a, b) => b.localeCompare(a));
        setYears(availableYears);

        // ถ้าปีที่เลือกอยู่ (year) ไม่อยู่ในลิสต์ ให้ดีดกลับมาปีปัจจุบันหรือปีแรกสุดที่มี
        if (!year || !availableYears.includes(year)) {
             if (availableYears.includes(currentThaiYear)) {
                 setYear(currentThaiYear);
             } else {
                 setYear(availableYears[0]);
             }
        }

      } catch (err) {
        console.error("Failed to fetch years", err);
        const currentYearInt = parseInt(currentThaiYear);
        setYears([
            currentThaiYear,
            (currentYearInt - 1).toString()
        ]);
        setYear(currentThaiYear);
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch Report Data
  useEffect(() => {
    if (!year) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentRound = budgetRounds.find(r => r.fiscalYear === year);
        const budgetLimit = currentRound?.totalBudget || 0; 
        setTotalBudget(budgetLimit);

        const res = await fetch(`/api/budget-report?year=${year}&status=APPROVED`, { cache: "no-store" });
        
        let fetchedReports: (BudgetReport & { imageSrc?: string })[] = [];
        if (res.ok) {
           const data = await res.json();
           fetchedReports = data.reports || [];
        }
        setReports(fetchedReports);

        const totalUsed = fetchedReports.reduce((sum, r) => sum + (r.totalActualExpense || 0), 0);
        let remaining = budgetLimit - totalUsed;
        if (remaining < 0) remaining = 0;

        const newChartData: ChartDataItem[] = [
            { 
                name: "งบประมาณที่ใช้ไป (Projects)", 
                value: totalUsed, 
                color: "#F97316"
            },
            { 
                name: "งบประมาณคงเหลือ", 
                value: remaining, 
                color: "#CBD5E1"
            }
        ];

        if (budgetLimit === 0 && totalUsed === 0) {
            setChartData([]);
        } else {
            setChartData(newChartData);
        }

      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, budgetRounds]);

  const chartTotal = chartData.reduce((sum, item) => sum + item.value, 0);
  const pieData = chartData.filter(item => item.value > 0);

  // คำนวณตัวเลือกปี: รวมปีจาก state และปีปัจจุบัน, ตัดซ้ำ
  const yearOptions = Array.from(new Set([...years.map(y => parseInt(y)), parseInt(currentThaiYear)]))
    .filter(y => y <= parseInt(currentThaiYear)) // ห้ามแสดงเกินปีปัจจุบัน
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= Hero ================= */}
      <section className="relative h-[400px] w-full bg-gray-800 mb-4">
        <div className="absolute inset-0">
             <Image
                src="/budget/covers/08.jpg"
                alt="Budget cover"
                fill
                objectFit="cover"
                priority
                className="object-cover"
                onError={(e) => {
                    const target = e.currentTarget;
                    target.srcset = "";
                    target.src = PLACEHOLDER_SRC;
                }}
             />
             <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end justify-end p-8 md:p-16">
            <h1 className="text-white text-3xl md:text-5xl font-bold text-right shadow-lg">
              รายงานงบประมาณ
            </h1>
        </div>
      </section>

      {/* ================= Content ================= */}
      <main className="container mx-auto mt-8 mb-16 px-4 py-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-2 md:mb-4">
            สรุปผลการเบิกจ่ายงบประมาณประจำปี {year}
          </h2>

          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={yearOptions.length === 0}
              className="appearance-none w-[140px] h-9 pl-4 pr-10 rounded-full border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>พ.ศ. {y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* ================= Chart ================= */}
        <div className="grid md:grid-cols-2 gap-10 mb-24 items-center">
          <div className="h-[400px] relative">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">
                 กำลังโหลดข้อมูล...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-xl px-4 text-center">
                 <AlertCircle className="w-8 h-8 mb-2"/>
                 <span>{error}</span>
              </div>
            ) : pieData.length === 0 ? (
              <div className="relative h-full w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ value: 1 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={180}
                        stroke="none"
                        fill="#F1F5F9"
                        isAnimationActive={false}
                      />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                     <PieChartIcon className="w-10 h-10 mb-2 opacity-50" />
                     <span className="text-sm font-medium">ยังไม่มีข้อมูล</span>
                 </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    stroke="white"
                    strokeWidth={3}
                  >
                    {pieData.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                      formatter={(value: number) => {
                        const percent = chartTotal > 0 ? (value / chartTotal) * 100 : 0;
                        return [`${percent.toFixed(0)}%`, "สัดส่วน"];
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-slate-600">
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="font-semibold text-orange-800 mb-2 text-lg">ภาพรวมการใช้งบประมาณจริง</h3>
                <p className="mb-4 text-sm text-slate-700">
                   แสดงสัดส่วนงบประมาณที่เบิกจ่ายจริงตามรายงานผลโครงการประจำปี {year}
                </p>
                {chartData.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((item, i) => {
                            const percent = chartTotal > 0 ? (item.value / chartTotal) * 100 : 0;
                            return (
                                <div key={i} className="flex items-center text-sm">
                                    <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></span>
                                    <span className="truncate flex-1">{item.name}</span>
                                    <span className="font-medium text-slate-900 ml-2">{percent.toFixed(0)}%</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">ไม่มีข้อมูลแสดง</p>
                )}
             </div>
          </div>
        </div>

        {/* ================= Reports List ================= */}
        <div>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"/>)}
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <FolderOpen className="w-12 h-12 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-600 mb-1">ไม่พบรายงานโครงการ</h4>
                    <p className="text-slate-400 text-sm">ยังไม่มีโครงการที่ได้รับการอนุมัติและส่งรายงานสรุปในปีงบประมาณ {year}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {reports.map((report) => {
                    const title = report.reportTitle || report.proposal?.projectName || "ไม่ระบุชื่อโครงการ";
                    const responsibilityUnit = report.proposal?.responsibilityUnit || "ไม่ระบุหน่วยงาน";
                    const hasImage = report.imageSrc || (report.images && report.images.length > 0);
                    const imageSrc = hasImage 
                        ? (report.imageSrc || report.images![0].imagePath)
                        : PLACEHOLDER_SRC;

                    return (
                        <div
                        key={report.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
                        >
                        <div className="relative h-48 bg-slate-200 overflow-hidden shrink-0">
                            <Image
                                src={imageSrc}
                                alt={title}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    e.currentTarget.srcset = "";
                                    e.currentTarget.src = PLACEHOLDER_SRC;
                                }}
                            />
                        </div>

                        <div className="p-5 flex flex-col grow">
                            <h4 className="font-bold text-xl text-slate-800">
                                {title}
                            </h4>
                            <p className="text-sm text-slate-500 flex-1">
                                {responsibilityUnit}
                            </p>
                            <div className="mt-2 pt-4 flex justify-end border-t border-slate-100">
                                <Link 
                                    href={`/user/budget/${report.id}`} 
                                >
                                    <PrimaryButton className="rounded-full text-sm px-6 py-2 shadow-sm">
                                        ดูรายละเอียดเพิ่มเติม
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                        </div>
                    );
                })}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}