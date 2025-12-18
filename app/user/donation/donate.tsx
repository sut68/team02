'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FaCircleInfo, FaSpinner } from 'react-icons/fa6'; // Icon สำหรับ Loading/Error

// --- 1. กำหนด Type สำหรับข้อมูลโครงการบริจาค ---
// อ้างอิงจาก Response Structure ของ /api/donation-project/route.ts (GET)
interface Transaction {
  amount: number;
  createdAt: string;
  donorName: string;
  isPublic: boolean;
}

interface DonationProject {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  ownerName: string;
  contact: string;
  posterUrl: string | null;
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
  progress: number;
  donorCount: number;
  transactions: Transaction[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Component สำหรับแสดงการ์ดโครงการเดียว ---
interface ProjectCardProps {
  project: DonationProject;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  // ฟังก์ชันช่วยจัดรูปแบบตัวเลข (ใช้ Intl.NumberFormat เพื่อความสะดวก)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusTag = (status: DonationProject['status']) => {
    switch (status) {
      case 'OPEN':
        return <Tag text="เปิดรับบริจาค" colorClass="bg-green-100 text-green-600" />;
      case 'CLOSED':
        return <Tag text="ปิดรับบริจาค" colorClass="bg-red-100 text-red-600" />;
      case 'COMPLETED':
        return <Tag text="บรรลุเป้าหมาย" colorClass="bg-blue-100 text-blue-600" />;
      default:
        return null;
    }
  };

  // Component เล็กๆ สำหรับ Tag (ปรับให้รับสีได้)
  const Tag = ({ text, colorClass }: { text: string, colorClass: string }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>
      {text}
    </span>
  );
  
  // URL สำหรับหน้ารายละเอียดของโครงการ (ใช้ ID จริง)
  const detailUrl = `/user/donation/${project.id}`;

  return (
    <Card className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex mb-8">
      {/* รูปภาพ (ซ้าย) - ใช้ posterUrl จริง */}
      <div className="md:w-1/3 bg-white flex items-center justify-center p-4">
        <Image
          // ใช้ posterUrl จริง หรือใช้ภาพสำรองหากไม่มี
          src={project.posterUrl || "/donation_poster/default.png"}
          alt={project.title}
          className="rounded-lg object-cover h-48 w-48 md:h-full md:w-full"
          width={300}
          height={300}
        />
      </div>

      {/* เนื้อหา (ขวา) */}
      <div className="md:w-2/3 p-6 flex flex-col justify-between">
        <div>
          {/* สถานะโครงการ */}
          <div className="mb-2">{getStatusTag(project.status)}</div> 
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h2>
          <p className="text-gray-600 mb-4 text-sm line-clamp-3">
            {project.description}
          </p>

          {/* รายละเอียดการระดมทุน */}
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-gray-700">
              ยอดบริจาค: <span className="text-orange-600">{formatCurrency(project.currentAmount)}</span>
            </p>
            <p className="font-semibold text-gray-700">
              เป้าหมาย: <span>{formatCurrency(project.goalAmount)}</span>
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-[#F26522] h-2.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                ></div>
            </div>
            <p className="text-right text-xs text-gray-500 pt-1">
                สำเร็จแล้ว <span className="font-bold">{project.progress.toFixed(2)}%</span> ({project.donorCount} ผู้บริจาค)
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <span>
            สิ้นสุด: {new Date(project.endDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
          </span>
          <Link href={detailUrl}>
            <PrimaryButton>
              รายละเอียด
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </Card>
  );
};


// --- 2. Main Component ที่มีการดึงข้อมูล ---
export default function DonationPage() {
  const [projects, setProjects] = useState<DonationProject[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        // เรียก API ที่คุณสร้างไว้ (ดึงแค่หน้าแรก)
        const response = await fetch('/api/donation-project'); 
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setProjects(data.projects);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('ไม่สามารถดึงข้อมูลโครงการบริจาคได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []); // [] คือการรันแค่ครั้งเดียวเมื่อ Component ถูก Mount

  // --- 3. การแสดงผลตามสถานะ ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-12 flex flex-col items-center justify-center text-orange-600">
          <FaSpinner className="animate-spin text-4xl mb-4" />
          <p className="text-lg">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-12 flex flex-col items-center justify-center text-red-600 bg-red-50 rounded-lg border border-red-300">
          <FaCircleInfo className="text-4xl mb-4" />
          <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="text-center p-12 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-gray-300">
          <p className="text-xl font-semibold">ไม่พบโครงการที่เปิดรับบริจาคในขณะนี้</p>
          <p className="text-sm mt-2">โปรดกลับมาตรวจสอบอีกครั้งในภายหลัง</p>
        </div>
      );
    }

    // --- 4. วนลูปแสดงผลการ์ดโครงการ ---
    return (
      <>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        
        {/* แสดงข้อมูล Pagination อย่างง่าย (ถ้ามี) */}
        {pagination && (
          <div className="text-right text-sm text-gray-500 mt-6">
            หน้า {pagination.page} จาก {pagination.totalPages} (รวม {pagination.total} โครงการ)
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen mb-8">
      <div className="container mx-auto max-w-8xl p-4 md:p-8 z-10 relative mb-8">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
          โครงการบริจาค
        </h2>

        {renderContent()}

      </div>
    </div >
  );
}