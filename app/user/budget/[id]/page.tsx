// app/user/budget/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {  
  Download, 
  CalendarDays,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { PrimaryButton } from "@/app/components/ui/Button";
import FallbackImage from "@/app/components/ui/FallBackImage";

// =========================================================
// 1. Helper Functions
// =========================================================

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatHour = (date: Date | string | null | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("th-TH", {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: "Asia/Bangkok"
  }) + " น.";
};

const PLACEHOLDER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect fill='%23f1f5f9' width='800' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='30' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// =========================================================
// 2. Data Fetching Logic
// =========================================================

async function getBudgetReport(id: number) {
  if (isNaN(id)) return null;

  const report = await prisma.summarySubmission.findUnique({
    where: { id },
    include: {
      proposal: {
        include: {
          staff: {
            select: {
              fullName: true,
              email: true,
            }
          }
        }
      },
      images: true,   
    },
  });

  return report;
}

// =========================================================
// 3. Main Page Component
// =========================================================

export default async function BudgetReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idString } = await params;
  const id = parseInt(idString);

  // ดึงข้อมูลจาก DB
  const report = await getBudgetReport(id);

  if (!report) return notFound();

  // --- Logic การเตรียมข้อมูล ---
  const allImages = report.images || [];
  const proposalCover = report.proposal?.coverFilePath;
  const coverImage = (allImages.length > 0 ? allImages[0].imagePath : null) || proposalCover || PLACEHOLDER_SRC;
  const projectName = report.proposal?.projectName || "ไม่ระบุชื่อโครงการ";

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="pt-10 pb-3 md:pt-8 md:pb-6">
         <div className="max-w-7xl mx-auto px-4">
             <div className="max-w-4xl">
                 <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight mb-4">
                    รายงานสรุปผล {projectName}
                 </h1>
                 <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm">
                    <div className="flex items-center gap-2">
                         <CalendarDays className="w-4 h-4" />
                         <span>{formatDate(report.updatedAt)} ({formatHour(report.updatedAt)})</span>
                    </div>
                 </div>
             </div>
         </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-12">
                 <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                      <FallbackImage
                        src={coverImage}
                        alt="Project Cover"
                        fill
                        className="object-cover"
                      />
                 </div>

                 {/* Gallery Grid */}
                 {allImages.length > 0 && (
                    <section className="pt-8">
                         <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-gray-900">ประมวลภาพกิจกรรม</h3>
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{allImages.length}</span>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allImages.map((img) => (
                                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                                    <FallbackImage
                                        src={img.imagePath}
                                        alt={`Activity ${img.id}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                         </div>
                    </section>
                 )}
            </div>

            <div className="lg:col-span-5 space-y-8">
                <div className="top-10 space-y-8">
                    <div className="space-y-6">
                        <h3 className="text-md font-bold text-gray-900 mb-0.5">รายละเอียดกิจกรรม</h3>
                        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-md">
                            {report.proposal?.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </div>
                    </div>

                    {report.proposal?.objective && (
                        <div className="space-y-6">
                            <h3 className="text-md font-bold text-gray-900 mb-0.5">วัตถุประสงค์</h3>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-md">
                                {report.proposal.objective}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-0.5">หน่วยงานรับผิดชอบ</h3>
                        <p className="text-gray-600">{report.proposal?.responsibilityUnit || "-"}</p>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-0.5">ระยะเวลาดำเนินงาน</h3>
                        <p className="text-gray-600">
                            {formatDate(report.proposal?.projectStartDate)} - {formatDate(report.proposal?.projectEndDate)}
                        </p>
                    </div>
                    <div className="h-px bg-gray-100 w-full my-6"></div>

                    {/* Download Section */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-2">เอกสารประกอบ</h3>
                        {report.summaryFilePath ? (
                           <a 
                               href={report.summaryFilePath} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="block"
                           >
                               <PrimaryButton className="w-full justify-center py-3 rounded-lg text-md">
                                   <Download className="w-4 h-4 mr-2" />
                                   ดาวน์โหลด PDF
                               </PrimaryButton>
                           </a>
                        ) : (
                           <p className="text-gray-400 text-md">ไม่พบเอกสารแนบ</p>
                        )}
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full my-6"></div>

                    <div>
                        <h3 className="text-md font-bold text-gray-900 mb-0.5">ผู้เขียนรายงาน</h3>
                        <div className="text-gray-600">
                            {report.proposal?.staff?.fullName || "ไม่มีข้อมูลชื่อผู้เขียน"}
                        </div>
                    </div>


                    <div className="pt-4">
                        <Link href="/user/budget">
                            <button className="w-full py-3 rounded-lg text-md border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                ปิดหน้านี้
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}