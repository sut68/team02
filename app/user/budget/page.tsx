"use client"

import Image from 'next/image';
import { 
  ChevronDown 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

// ใช้ Button เดิมที่คุณมี
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const chartData = [
  { name: 'งบประมาณโครงการผ่านการพิจารณา', value: 50, color: '#F97316' }, // Orange-500
  { name: 'เงินบริจาคโครงการต่างๆ', value: 25, color: '#52525B' }, // Zinc-600 (ปรับให้เข้มขึ้นนิดนึงเพื่อให้ text ขาวอ่านง่าย)
  { name: 'ใช้จ่ายสำหรับจัดการแพลตฟอร์ม', value: 25, color: '#D4D4D8' }, // Zinc-300
];

const projects = [
  {
    id: 1,
    title: "รายงานงบประมาณโครงการทุนการศึกษา 1/2568",
    image: "/budget/22-01.jpg",
  },
  {
    id: 2,
    title: "รายงานงบประมาณโครงการพัฒนาทักษะวิชาชีพ",
    image: "/budget/22-01.jpg",
  },
  {
    id: 3,
    title: "รายงานงบประมาณโครงการพัฒนาทักษะวิชาชีพ (เพิ่มเติม)",
    image: "/budget/22-01.jpg",
  },
];

// --- ฟังก์ชันจัด Style ตัวเลขบนกราฟ ---
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
      className="text-lg font-bold drop-shadow-md" // เพิ่มขนาดตัวอักษรและเงาเล็กน้อย
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function BudgetReportPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- Hero Section --- */}
      <section className="relative h-80 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/budget/22-01.jpg" 
            alt="SUT Environment" 
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/40 to-white/10" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-end px-6 md:px-20">
          <h1 className="text-2xl md:text-5xl font-semibold text-orange-500 drop-shadow-sm tracking-tight text-right">
            รายงานผลงบประมาณ
          </h1>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-600 mb-8 md:mb-12">รายงานงบประมาณ</h2>

        {/* --- Chart Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-center">
          
          {/* Pie Chart Zone */}
          <div className="h-[300px] md:h-[350px] w-full relative flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={140} // ปรับขนาดให้ใหญ่ขึ้นเล็กน้อย
                    innerRadius={0}
                    dataKey="value"
                    stroke="white"    // ใช้เส้นขอบสีขาวแทน paddingAngle
                    strokeWidth={3}   // ความหนาของเส้นขอบ
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'สัดส่วน']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>

          {/* Legend Zone */}
          <div className="space-y-6 px-4">
            <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-5 relative">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div 
                            className="w-4 h-4 rounded-full mt-1 shrink-0 shadow-sm" 
                            style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-slate-600 text-sm leading-relaxed font-medium">
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-400 text-center md:text-left mt-2 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-orange-500 transition-colors">
                รายละเอียดการใช้งบประมาณของแต่ละโครงการท่านสามารถดูได้ที่ด้านล่าง
            </p>
          </div>
        </div>

        {/* --- Filter Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm md:text-base">
                <span>เลือกรายงานโครงการเฉพาะปี</span>
                
                <div className="relative">
                    <select 
                        className="appearance-none w-[120px] h-9 pl-4 pr-10 rounded-full border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all cursor-pointer shadow-sm"
                        defaultValue="2568"
                    >
                        <option value="2568">พ.ศ. 2568</option>
                        <option value="2567">พ.ศ. 2567</option>
                        <option value="2566">พ.ศ. 2566</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {projects.map((project) => (
                <div 
                    key={project.id} 
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                    <div className="relative h-48 w-full overflow-hidden">
                        <Image 
                            src={project.image} 
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay เล็กน้อยให้รูปดูสวยขึ้น */}
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-center min-h-[100px]">
                        <p className="text-base font-medium text-slate-700 line-clamp-2 leading-relaxed group-hover:text-orange-600 transition-colors">
                            {project.title}
                        </p>
                    </div>
                    
                    <div className="p-5 pt-0 flex justify-end">
                        <Button 
                            size="sm" 
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs px-6 py-2 h-auto font-medium shadow-orange-200 shadow-lg hover:shadow-orange-300 hover:-translate-y-0.5 transition-all"
                        >
                            อ่านรายละเอียดเพิ่มเติม
                        </Button>
                    </div>
                </div>
            ))}
        </div>

      </main>
    </div>
  );
}