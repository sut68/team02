'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Layers, CheckCircle, Clock, Search, ChevronDown, PlusCircle, Landmark, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import Link from 'next/link';

type ProjectStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' ;
type FilterStatus = 'all' | 'open' | 'closed' | 'completed' | 'central';

// กำหนด Type ให้ตรงกับ Response จาก API
type Project = {
  id: number;
  title: string;
  goalAmount: number;
  currentAmount: number;
  startDate: string; 
  endDate: string;   
  status: ProjectStatus;
  ownerName: string;
  posterUrl: string | null;
  createdAt: string;
  projectType: string;
  // isCentralFund: boolean;
};

// Response Shape จาก API
type ApiResponse = {
  projects: Project[];
  pagination: any;
};

const formatThaiDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export default function ProjectManagementUI() {
  // 1. เปลี่ยนจากรับ Props มาเป็น State เริ่มต้นว่างๆ
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); // เพิ่ม Loading State

  // 2. ใช้ useEffect ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/donation-project'); // เรียก API
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data: ApiResponse = await response.json();
        
        // ตรวจสอบว่ามีข้อมูล projects หรือไม่
        if (data.projects && Array.isArray(data.projects)) {
            setProjects(data.projects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        alert('ไม่สามารถดึงข้อมูลโครงการได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []); // Run ครั้งเดียวตอนโหลดหน้า

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter(project => {
      let matchesStatus = false;
      
      if (activeStatus === 'all') {
        matchesStatus = true;
      } else if (activeStatus === 'central') {
        matchesStatus = project.projectType === 'CENTRAL';
      } else {
        matchesStatus = project.status.toLowerCase() === activeStatus;
      }

      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
        
      return matchesStatus && matchesSearch;
    });
  }, [projects, activeStatus, searchTerm]);

  const getStatusCount = (status: FilterStatus) => {
    if (!projects) return 0;
    if (status === 'all') return projects.length;
    if (status === 'central') return projects.filter(p => p.projectType === 'CENTRAL').length;
    return projects.filter(p => p.status.toLowerCase() === status).length;
  };

  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'COMPLETED':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'CLOSED':
        return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusDisplay = (status: ProjectStatus) => {
    switch (status) {
      case 'OPEN': return 'เปิดรับ';
      case 'COMPLETED': return 'สำเร็จ';
      case 'CLOSED': return 'ปิดรับ';
      default: return '-';
    }
  };

  const getProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const handleStatusUpdate = async (projectId: number, newStatus: ProjectStatus) => {
    const statusText = getStatusDisplay(newStatus);
    const confirmed = confirm(`คุณต้องการเปลี่ยนสถานะโครงการ ID ${projectId} เป็น "${statusText}" หรือไม่?`);

    if (confirmed) {
      try {
        const response = await fetch(`/api/donation-project`, { // หมายเหตุ: ปกติควรเป็น /api/donation-project/${id} หรือส่ง id ใน body
          method: "PUT", // API ของคุณก่อนหน้านี้ใช้ PUT สำหรับ update
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: projectId, status: newStatus }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }

        setProjects(prev =>
          prev.map(p =>
            p.id === projectId ? { ...p, status: newStatus } : p
          )
        );

        alert("อัปเดตสถานะสำเร็จ!");
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปเดตสถานะ', error);
        alert('❌ การอัปเดตสถานะล้มเหลว กรุณาตรวจสอบการเชื่อมต่อ');
      }
    }
  };

  // 3. แสดงหน้าจอ Loading ขณะดึงข้อมูล
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#F26522] animate-spin" />
          <p className="text-gray-500">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            การจัดการโครงการระดมทุน
          </h1>
          <Link href="/admin/donation/create">
            <button className="flex items-center space-x-2 bg-[#F26522] text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition shadow-sm">
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">เพิ่มโครงการใหม่</span>
            </button>
          </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'all' ? 'border-orange-500 shadow-md bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
            onClick={() => setActiveStatus('all')}
          >
            <CardContent className="p-6 text-center">
              <Layers className="w-10 h-10 text-gray-500 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-gray-600">ทั้งหมด</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">{getStatusCount('all')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'central' ? 'border-purple-500 shadow-md bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
            onClick={() => setActiveStatus('central')}
          >
            <CardContent className="p-6 text-center">
              <Landmark className="w-10 h-10 text-purple-500 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-gray-600">กองทุนกลาง</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">{getStatusCount('central')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'open' ? 'border-green-500 shadow-md bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
            onClick={() => setActiveStatus('open')}
          >
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 text-green-500 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-gray-600">เปิดรับ (Open)</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">{getStatusCount('open')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'completed' ? 'border-blue-500 shadow-md bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => setActiveStatus('completed')}
          >
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-gray-600">สำเร็จ/ปิด (Done)</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">{getStatusCount('completed')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อโครงการ หรือผู้รับผิดชอบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none text-sm transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">โครงการ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">เป้าหมาย/ปัจจุบัน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ผู้รับผิดชอบ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูลโครงการตามตัวกรอง
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <Link href={`/admin/donation/${project.id}/edit`} className="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center">
                            {project.projectType === 'CENTRAL' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    กองทุนกลาง
                                </span>
                            )}
                            {project.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 mb-1">฿{project.currentAmount.toLocaleString()} / ฿{project.goalAmount.toLocaleString()}</div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-[#F26522] h-2 rounded-full"
                              style={{ width: `${getProgress(project.currentAmount, project.goalAmount)}%` }}>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatThaiDate(project.startDate)} - {formatThaiDate(project.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.ownerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={project.status}
                              onChange={(e) => handleStatusUpdate(project.id, e.target.value as ProjectStatus)}
                              className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 outline-none cursor-pointer transition-colors ${getStatusStyle(project.status)}`}
                            >
                              <option value="OPEN">เปิดรับ</option>
                              <option value="CLOSED">ปิดรับ</option>
                              <option value="COMPLETED">สำเร็จ</option>
                            </select>
                            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600`} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/admin/donation/${project.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            แก้ไข
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}