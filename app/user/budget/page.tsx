"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import { PrimaryButton } from "@/app/components/ui/Button";
//
import { BudgetRound } from "@/app/types/budget_approval";
//
import { BudgetReport } from "@/app/types/budget_report";

// ✅ 1. สร้าง Placeholder แบบ SVG (Data URI) เพื่อความชัวร์ ไม่ต้องพึ่งไฟล์
const PLACEHOLDER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect fill='%23f1f5f9' width='800' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='30' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

/* =======================
   Types
======================= */
type ChartDataItem = {
  name: string;
  value: number;
  color: string;
};

type BudgetReportResponse = {
  reports: (BudgetReport & { imageSrc?: string })[]; 
};

/* =======================
   Pie label
======================= */
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

/* =======================
   Page
======================= */
export default function BudgetReportPage() {
  const [years, setYears] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [reports, setReports] = useState<(BudgetReport & { imageSrc?: string })[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Years List
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/budget-round");
        if (res.ok) {
            const data = await res.json();
            const rounds: BudgetRound[] = data.budgetRounds || [];
            
            const uniqueYears = Array.from(new Set(
                rounds
                    .map(r => r.fiscalYear)
                    .filter((y): y is string => !!y)
            )).sort((a, b) => b.localeCompare(a));
            
            setYears(uniqueYears);
            if (uniqueYears.length > 0) setYear(uniqueYears[0]);
            else setYear("2568"); 
        }
      } catch (err) {
        console.error("Failed to fetch years", err);
        setYears(["2568"]);
        setYear("2568");
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

        // ดึงเฉพาะสถานะ APPROVED
        const res = await fetch(
          `/api/budget-report?year=${year}&status=APPROVED`, 
          { cache: "no-store" }
        );

        if (!res.ok) {
           if (res.status === 404) {
               setReports([]);
               setChartData([]);
               return;
           }
           throw new Error("โหลดข้อมูลไม่สำเร็จ");
        }

        const data: BudgetReportResponse = await res.json();
        const fetchedReports = data.reports || [];
        setReports(fetchedReports);

        // --- คำนวณ Chart Data ---
        if (fetchedReports.length > 0) {
            const chartMap = new Map<string, number>();
            fetchedReports.forEach(r => {
                const name = r.proposal?.projectName || "ไม่ระบุ";
                const value = r.totalActualExpense || 0;
                chartMap.set(name, (chartMap.get(name) || 0) + value);
            });

            const colors = ["#F97316", "#FB923C", "#FDBA74", "#FFEDD5", "#C05621"];
            const calculatedChartData: ChartDataItem[] = Array.from(chartMap.entries()).map(([name, value], index) => ({
                name,
                value,
                color: colors[index % colors.length]
            })).filter(item => item.value > 0);

            setChartData(calculatedChartData);
        } else {
            setChartData([]);
        }

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        setReports([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= Hero ================= */}
      <section className="relative h-80 w-full overflow-hidden bg-slate-200">
        <div className="absolute inset-0">
             <Image
                src="/25.jpg"
                alt="Budget cover"
                fill
                priority
                className="object-cover opacity-90"
                // ✅ แก้ไขส่วน Cover ด้วย (ถ้าไฟล์นี้ไม่มีก็ใช้ placeholder)
                onError={(e) => {
                    e.currentTarget.srcset = "";
                    e.currentTarget.src = PLACEHOLDER_SRC;
                }}
             />
             <div className="absolute inset-0 bg-linear-to-r from-orange-400 to-orange-600 opacity-20 -z-10" />
        </div>

        <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/40 to-white/10" />
        <div className="absolute inset-0 flex items-center justify-end px-6 md:px-20">
          <h1 className="text-2xl md:text-5xl font-semibold text-orange-500 drop-shadow-sm">
            รายงานผลงบประมาณ
          </h1>
        </div>
      </section>

      {/* ================= Content ================= */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl font-bold text-slate-700 mb-6 border-l-4 border-orange-500 pl-3">
            รายงานสรุปผลโครงการ
          </h2>

          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={years.length === 0}
              className="appearance-none w-[140px] h-9 pl-4 pr-10 rounded-full border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
            >
              {years.map((y) => (
                <option key={y} value={y}>พ.ศ. {y}</option>
              ))}
              {years.length === 0 && <option value="2568">พ.ศ. 2568</option>}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* ================= Chart ================= */}
        <div className="grid md:grid-cols-2 gap-10 mb-16 items-center">
          <div className="h-[350px] relative">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">
                 กำลังโหลดข้อมูล...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-xl px-4 text-center">
                 <AlertCircle className="w-8 h-8 mb-2"/>
                 <span>{error}</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span>ยังไม่มีข้อมูลการเบิกจ่ายในปีนี้</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    stroke="white"
                    strokeWidth={3}
                  >
                    {chartData.map((item, index) => (
                      <Cell key={index} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number) => [`฿${value.toLocaleString()}`, "งบประมาณที่ใช้"]}
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
                {/* Legend */}
                {chartData.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((item, i) => (
                            <div key={i} className="flex items-center text-sm">
                                <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="truncate flex-1">{item.name}</span>
                                <span className="font-medium text-slate-900 ml-2">฿{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">ไม่มีข้อมูลแสดง</p>
                )}
             </div>
          </div>
        </div>

        {/* ================= Reports List ================= */}
        <div>
            <h3 className="text-3xl font-bold text-slate-700 mb-6 border-l-4 border-orange-500 pl-3">
                รายงานสรุปผลโครงการ
            </h3>
            
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"/>)}
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    ไม่พบรายงานผลโครงการที่อนุมัติแล้วในปีงบประมาณนี้
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => {
                    const title = report.reportTitle || report.proposal?.projectName || "ไม่ระบุชื่อโครงการ";
                    // ✅ 2. เช็คว่ามีรูปหรือไม่ ถ้าไม่มีให้ใช้ PLACEHOLDER_SRC ทันที เพื่อลด Error
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
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                // ✅ 3. แก้ไข onError ให้ใช้ตัวแปร SVG แทน URL ไฟล์
                                onError={(e) => {
                                    e.currentTarget.srcset = "";
                                    e.currentTarget.src = PLACEHOLDER_SRC;
                                }}
                            />
                        </div>

                        <div className="p-5 flex flex-col grow">
                            <h4 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                                {title}
                            </h4>
                            
                            <div className="text-sm text-slate-500 mb-4 space-y-1">
                                <p>หน่วยงาน: {report.proposal?.responsibilityUnit || "-"}</p>
                                <p>งบที่ใช้จริง: <span className="font-semibold text-slate-700">฿{(report.totalActualExpense || 0).toLocaleString()}</span></p>
                            </div>

                            <div className="mt-auto pt-4">
                                <PrimaryButton className="rounded-full text-xs px-6 py-2 w-full shadow-md">
                                    ดูรายละเอียดรายงาน
                                </PrimaryButton>
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