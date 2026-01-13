'use client';

import { useState, useMemo, useEffect } from 'react';
import { Layers, CheckCircle, Clock, Search, ChevronDown, PlusCircle, Landmark, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import Link from 'next/link';

type ProjectStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' ;
type FilterStatus = 'all' | 'open' | 'closed' | 'completed' | 'central';

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

type ApiResponse = {
  projects: Project[];
  pagination: any;
};

// --- Helper Functions ---
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/donation-project');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data: ApiResponse = await response.json();
        
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
  }, []);

  // --- Filtering Logic ---
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

  // --- Stats Logic ---
  const getStatusCount = (status: FilterStatus) => {
    if (!projects) return 0;
    if (status === 'all') return projects.length;
    if (status === 'central') return projects.filter(p => p.projectType === 'CENTRAL').length;
    return projects.filter(p => p.status.toLowerCase() === status).length;
  };

  const getProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  // --- Action Handlers ---
  const handleStatusUpdate = async (projectId: number, newStatus: ProjectStatus) => {
    const statusTextMap: Record<ProjectStatus, string> = {
        'OPEN': 'เปิดรับ',
        'CLOSED': 'ปิดรับ',
        'COMPLETED': 'สำเร็จ'
    };
    const statusText = statusTextMap[newStatus];
    const confirmed = confirm(`คุณต้องการเปลี่ยนสถานะโครงการ ID ${projectId} เป็น "${statusText}" หรือไม่?`);

    if (confirmed) {
      try {
        const response = await fetch(`/api/donation-project`, {
          method: "PUT",
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
      } catch (error) {
        console.error('Update failed', error);
        alert('❌ การอัปเดตสถานะล้มเหลว กรุณาตรวจสอบการเชื่อมต่อ');
      }
    }
  };

  if (isLoading) {
    return (
      // เอา bg-gray-50 ออกจากหน้า Loading
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }

  return (
    // เอา bg-gray-50 ออกจาก Main Container
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            การจัดการโครงการ
          </h1>
          <Link href="/admin/donation/create">
            <button className="flex items-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition shadow-sm">
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">เพิ่มโครงการใหม่</span>
            </button>
          </Link>
        </div>

        {/* --- Status Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'all' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setActiveStatus('all')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Layers className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ทั้งหมด</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('all')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'central' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setActiveStatus('central')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Landmark className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">กองทุนกลาง</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('central')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'open' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setActiveStatus('open')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Clock className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">เปิดรับ (Open)</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('open')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${activeStatus === 'completed' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setActiveStatus('completed')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">สำเร็จ/ปิด (Done)</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('completed')}</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Search Bar --- */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อโครงการ หรือผู้รับผิดชอบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* --- Projects Table --- */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">โครงการ</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">เป้าหมาย/ปัจจุบัน</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ผู้รับผิดชอบ</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 mb-1">฿{project.currentAmount.toLocaleString()} / ฿{project.goalAmount.toLocaleString()}</div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${getProgress(project.currentAmount, project.goalAmount)}%` }}>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatThaiDate(project.startDate)} - {formatThaiDate(project.endDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{project.ownerName}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <select
                              value={project.status}
                              onChange={(e) => handleStatusUpdate(project.id, e.target.value as ProjectStatus)}
                              className="w-[110px] appearance-none px-3 py-1 pr-6 rounded-full text-xs font-medium border-0 outline-none transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer text-center"
                            >
                              <option value="OPEN">เปิดรับ</option>
                              <option value="CLOSED">ปิดรับ</option>
                              <option value="COMPLETED">สำเร็จ</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-700" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <Link href={`/admin/donation/${project.id}/edit`} className="text-orange-600 hover:underline hover:text-orange-800">
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