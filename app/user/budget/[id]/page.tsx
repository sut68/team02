import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Building2, Wallet, TrendingUp, PiggyBank, Download, ImageIcon } from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { PrimaryButton } from "@/app/components/ui/Button";
import FallbackImage from "@/app/components/ui/FallBackImage";

// Helper Formatter
const formatCurrency = (amount: number | null | undefined) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const PLACEHOLDER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect fill='%23f1f5f9' width='800' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='30' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// ✅ แก้ไข Type Params เป็น Promise
export default async function BudgetReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ ต้อง await params ก่อน
  const { id: idString } = await params;
  const id = parseInt(idString);

  if (isNaN(id)) return notFound();

  // 1. ดึงข้อมูลรายงาน
  const report = await prisma.summarySubmission.findUnique({
    where: { id },
    include: {
      proposal: true, 
      images: true,   
    },
  });

  if (!report) return notFound();

  // 2. คำนวณตัวเลข
  const approvedBudget = report.proposal?.requestedAmount || 0; 
  const usedBudget = report.totalActualExpense || 0;            
  const remainingBudget = Math.max(0, approvedBudget - usedBudget); 

  // 3. เตรียมรูปภาพ
  const allImages = report.images || [];
  
  // ใช้ any casting เฉพาะจุดนี้เผื่อ Type Prisma ยังไม่อัปเดต
  const proposalCover = (report.proposal as any)?.coverFilePath;
  const coverImage = (allImages.length > 0 ? allImages[0].imagePath : null) || proposalCover || PLACEHOLDER_SRC;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/user/budget" 
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">
                {report.proposal?.projectName || "รายละเอียดรายงาน"}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                <Building2 className="w-3 h-3" />
                {report.proposal?.responsibilityUnit || "ไม่ระบุหน่วยงาน"}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* 1. Stats Cards */}
        <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                    <Wallet className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 mb-1">งบประมาณที่ได้รับ</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(approvedBudget)}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 mb-1">ใช้จ่ายจริง</p>
                <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(usedBudget)}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-3">
                    <PiggyBank className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 mb-1">งบประมาณคงเหลือ</p>
                <h3 className="text-2xl font-bold text-green-600">{formatCurrency(remainingBudget)}</h3>
            </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* 2. Left Content */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Cover Image - ✅ ใช้ FallbackImage แทน Image */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-sm bg-slate-200">
                     <FallbackImage
                        src={coverImage}
                        alt="Project Cover"
                        fill
                        className="object-cover"
                        priority
                     />
                </div>

                {/* Details Text */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-orange-500 pl-3">
                        รายละเอียดการดำเนินงาน
                    </h2>
                    
                    <div className="space-y-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        <p>
                            {report.proposal?.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                        
                        {report.proposal?.objective && (
                           <div className="mt-4">
                              <h3 className="font-semibold text-slate-700 mb-2">วัตถุประสงค์</h3>
                              <p>{report.proposal.objective}</p>
                           </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">วันที่เริ่มโครงการ</span>
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    {formatDate(report.proposal?.projectStartDate)}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">วันที่สิ้นสุด</span>
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    {formatDate(report.proposal?.projectEndDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Grid */}
                {allImages.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-700">
                            <ImageIcon className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">ภาพกิจกรรม ({allImages.length})</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allImages.map((img) => (
                                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                                    {/* ✅ ใช้ FallbackImage แทน Image */}
                                    <FallbackImage
                                        src={img.imagePath}
                                        alt={`Activity ${img.id}`}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Right Sidebar */}
            <div className="space-y-6">
                
                {/* PDF Download Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-full mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-center font-bold text-slate-800 mb-2">รายงานฉบับสมบูรณ์</h3>
                    <p className="text-center text-sm text-slate-500 mb-6">
                        ดาวน์โหลดเอกสาร PDF เพื่อดูรายละเอียดโครงการทั้งหมด
                    </p>
                    
                    {report.summaryFilePath ? (
                        <a 
                            href={report.summaryFilePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <PrimaryButton className="w-full justify-center py-3 rounded-xl shadow-lg shadow-orange-100 transition-transform hover:-translate-y-1">
                                <Download className="w-4 h-4 mr-2" />
                                เปิดดูไฟล์ PDF
                            </PrimaryButton>
                        </a>
                    ) : (
                        <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed flex items-center justify-center font-medium">
                            ไม่พบไฟล์เอกสาร
                        </button>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-center text-slate-400">
                        อัปเดตล่าสุด: {formatDate(report.updatedAt)}
                    </div>
                </div>

            </div>
        </div>

      </main>
    </div>
  );
}