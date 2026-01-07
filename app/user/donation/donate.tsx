'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FaCircleInfo, FaSpinner, FaTag } from 'react-icons/fa6'; 

// --- 1. ปรับ Interface ให้ตรงกับ Schema ใหม่ ---
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
  // ✅ เปลี่ยนจาก isCentralFund เป็น projectType
  projectType: 'CENTRAL' | 'SCHOLARSHIP' | 'ACTIVITY' | 'RESEARCH' | 'BUILDING' | 'EMERGENCY' | 'OTHER';
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

// --- Helper: แปลง ProjectType เป็นภาษาไทย ---
const getProjectTypeLabel = (type: string) => {
  switch (type) {
    case 'SCHOLARSHIP': return 'ทุนการศึกษา';
    case 'ACTIVITY': return 'กิจกรรม';
    case 'RESEARCH': return 'งานวิจัย';
    case 'BUILDING': return 'อาคารสถานที่';
    case 'EMERGENCY': return 'ช่วยเหลือฉุกเฉิน';
    case 'OTHER': return 'ทั่วไป';
    default: return type;
  }
};

const getProjectTypeColor = (type: string) => {
  switch (type) {
    case 'EMERGENCY': return 'bg-red-100 text-red-700 border-red-200';
    case 'SCHOLARSHIP': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'RESEARCH': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// --- Component สำหรับแสดงการ์ดโครงการเดียว ---
interface ProjectCardProps {
  project: DonationProject;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusTag = (status: DonationProject['status']) => {
    switch (status) {
      case 'OPEN':
        return <Tag text="เปิดรับบริจาค" colorClass="bg-green-100 text-green-600 border-green-200" />;
      case 'CLOSED':
        return <Tag text="ปิดรับบริจาค" colorClass="bg-red-100 text-red-600 border-red-200" />;
      case 'COMPLETED':
        return <Tag text="บรรลุเป้าหมาย" colorClass="bg-blue-100 text-blue-600 border-blue-200" />;
      default:
        return null;
    }
  };

  const Tag = ({ text, colorClass }: { text: string, colorClass: string }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorClass}`}>
      {text}
    </span>
  );
  
  const detailUrl = `/user/donation/${project.id}`;

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl md:flex mb-6 border border-gray-100">
      {/* รูปภาพ */}
      <div className="md:w-1/3 bg-gray-50 flex items-center justify-center relative min-h-[400px]">
        <Image
          src={project.posterUrl || "/donation_poster/default-poster.png"}
          alt={project.title}
          className="object-cover w-full h-full"
          fill
        />
      </div>

      {/* เนื้อหา */}
      <div className="md:w-2/3 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
             {getStatusTag(project.status)}
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-[#F26522] transition-colors">
            <Link href={detailUrl}>{project.title}</Link>
          </h2>
          <p className="text-gray-600 mb-4 text-sm line-clamp-2">
            {project.description}
          </p>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
                <span className="text-[#F26522]">{formatCurrency(project.currentAmount)}</span>
                <span className="text-gray-500">เป้าหมาย {formatCurrency(project.goalAmount)}</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-orange-400 to-[#F26522] h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min(project.progress, 100)}%` }}
                ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
                <span>ผู้บริจาค {project.donorCount} คน</span>
                <span>{project.progress.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <span className="hidden md:inline">สิ้นสุดโครงการ:</span> 
            {new Date(project.endDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
          </span>
          <Link href={detailUrl}>
            <PrimaryButton className="shadow-md hover:shadow-lg">
              รายละเอียด
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </Card>
  );
};

// --- 2. Main Component ---
export default function DonationPage() {
  const [projects, setProjects] = useState<DonationProject[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        // เรียก API โดยใช้ filter=active เพื่อดึงเฉพาะโครงการที่เปิดอยู่
        const response = await fetch('/api/donation-project?filter=active'); 
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // ✅ กรองข้อมูลที่หน้าบ้าน: เอาเฉพาะ ProjectType ที่ไม่ใช่ 'CENTRAL'
        const filteredProjects = data.projects.filter((p: DonationProject) => p.projectType !== 'CENTRAL');
        
        setProjects(filteredProjects);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('ไม่สามารถดึงข้อมูลโครงการบริจาคได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-orange-600">
          <FaSpinner className="animate-spin text-4xl mb-4" />
          <p className="text-lg">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-red-600 bg-red-50 rounded-xl border border-red-200 mx-4">
          <FaCircleInfo className="text-4xl mb-4" />
          <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200 mx-4">
          <p className="text-xl font-semibold">ไม่พบโครงการที่เปิดรับบริจาคในขณะนี้</p>
          <p className="text-sm mt-2">โปรดกลับมาตรวจสอบอีกครั้งในภายหลัง</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
             {/* Pagination Controls สามารถเพิ่มตรงนี้ได้ถ้าต้องการ */}
             <span className="text-sm text-gray-500">
                แสดง {projects.length} จากทั้งหมด {pagination.total} โครงการ
             </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4">
      <div className="container mx-auto mb-2 px-4 py-0 ">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                โครงการระดมทุน
                </h2>
                <p className="text-gray-500">ร่วมเป็นส่วนหนึ่งในการสนับสนุนกิจกรรมและช่วยเหลือพี่น้องชาววิศวะ</p>
            </div>
        </div>

        {renderContent()}

      </div>
    </div >
  );
}