"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

import { PrimaryButton } from "@/app/components/ui/Button";

/* =======================
   Types
======================= */
type ChartDataItem = {
  name: string;
  value: number;
  color: string;
};

type Project = {
  id: string;
  title: string;
  image: string;
};

type BudgetReportResponse = {
  chartData: ChartDataItem[];
  projects: Project[];
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
  const [year, setYear] = useState("2568");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/user/budget/report?year=${year}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("โหลดข้อมูลไม่สำเร็จ");
        }

        const data: BudgetReportResponse = await res.json();
        setChartData(data.chartData ?? []);
        setProjects(data.projects ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= Hero ================= */}
      <section className="relative h-80 w-full overflow-hidden">
        <Image
          src="/budget/22-01.jpg"
          alt="Budget cover"
          fill
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/40 to-white/10" />
        <div className="absolute inset-0 flex items-center justify-end px-6 md:px-20">
          <h1 className="text-2xl md:text-5xl font-semibold text-orange-500">
            รายงานผลงบประมาณ
          </h1>
        </div>
      </section>

      {/* ================= Content ================= */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-slate-600">
            รายงานงบประมาณ
          </h2>

          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="appearance-none w-[140px] h-9 pl-4 pr-10 rounded-full border border-slate-300 bg-white text-sm"
            >
              <option value="2568">พ.ศ. 2568</option>
              <option value="2567">พ.ศ. 2567</option>
              <option value="2566">พ.ศ. 2566</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* ================= Chart ================= */}
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <div className="h-[350px]">
            {loading ? (
              <div className="h-full rounded-xl bg-slate-100 animate-pulse" />
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : chartData.length === 0 ? (
              <div className="text-slate-500">ไม่มีข้อมูล</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
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
                    formatter={(v: number) => [`${v}`, "สัดส่วน"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center text-slate-600">
            เลือกปีงบประมาณเพื่อดูสัดส่วนการใช้งบของแต่ละโครงการ
          </div>
        </div>

        {/* ================= Projects ================= */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            >
              <div className="relative h-48">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-5">
                <p className="font-medium mb-4">{project.title}</p>
                <PrimaryButton className="rounded-full text-xs px-5 py-2">
                  อ่านรายละเอียดเพิ่มเติม
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
