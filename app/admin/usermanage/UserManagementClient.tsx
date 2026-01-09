'use client';

import React, { useState } from 'react';
import { Layers, RefreshCw, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';

type VerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

type TransformedUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  educationRecord: {
    id: number;
    studentCode: string;
    major: string;
    gradYear: number | null;
    status: string;
    transcript: string | null;
  } | null;
  verification: {
    id: number;
    status: VerifyStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    remark: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialUsers: TransformedUser[];
};

export default function UserManagementClient({ initialUsers }: Props) {
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [users, setUsers] = useState<TransformedUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other' | undefined>(undefined);

  const openPreview = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) setPreviewType('pdf');
    else if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/)) setPreviewType('image');
    else setPreviewType('other');
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(undefined);
    setPreviewType(undefined);
  };

  const filteredUsers = users.filter(user => {
    const verifyStatus = user.verification?.status.toLowerCase() || 'pending';
    const matchesStatus = activeStatus === 'all' || verifyStatus === activeStatus;
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.educationRecord?.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return users.length;
    return users.filter(u => {
      const verifyStatus = u.verification?.status.toLowerCase() || 'pending';
      return verifyStatus === status;
    }).length;
  };

  const handleStatusChange = async (userId: number, newStatus: VerifyStatus) => {
    const statusTextMap = {
      'PENDING': 'รอดำเนินการ',
      'APPROVED': 'อนุมัติแล้ว',
      'REJECTED': 'ไม่อนุมัติ'
    };
    const statusText = statusTextMap[newStatus];
    
    let remark = '';
    if (newStatus === 'REJECTED') {
      remark = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:') || '';
      if (!remark) {
        alert('กรุณาระบุเหตุผลในการปฏิเสธ');
        return;
      }
    }

    const confirmed = confirm(
      `คุณต้องการเปลี่ยนสถานะเป็น "${statusText}" หรือไม่?\n\n${newStatus !== 'PENDING' ? 'ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้ใช้' : ''}`
    );
    
    if (confirmed) {
      try {
        const response = await fetch('/api/admin/update-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId.toString(),
            status: newStatus,
            remark
          }),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          const data = await response.json();
          alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
        }
      } catch (error) {
        alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'STUDENT': 'นักศึกษา',
      'ALUMNI': 'ศิษย์เก่า',
      'ADMIN': 'ผู้ดูแลระบบ'
    };
    return roleMap[role] || role;
  };

  const getEducationDisplay = (user: TransformedUser) => {
    if (!user.educationRecord) return '-';
    const { status, gradYear } = user.educationRecord;
    if (status === 'GRADUATED' && gradYear) {
      return `จบการศึกษา ${gradYear}`;
    }
    return 'กำลังศึกษา';
  };

  return (
    <>
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">การจัดการสมาชิก</h1>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'all' ? 'border-orange-300' : 'border-orange-100'
            }`}
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
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'pending' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('pending')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">รอดำเนินการ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('pending')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'approved' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('approved')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">อนุมัติแล้ว</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('approved')}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${
              activeStatus === 'rejected' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveStatus('rejected')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ไม่อนุมัติ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getStatusCount('rejected')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ค้นหาด้วยชื่อ รหัสนิสิต หรืออีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
                size="md"
                radius="md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ชื่อ-สกุล</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ประเภทสมาชิก</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">รหัสนักศึกษา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สาขาวิชา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะการศึกษา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">อีเมล</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">เอกสารแนบ</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูลสมาชิก
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const verifyStatus = user.verification?.status || 'PENDING';
                      return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-800">{user.fullName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{getRoleDisplay(user.role)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.educationRecord?.studentCode || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.educationRecord?.major || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{getEducationDisplay(user)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.educationRecord?.transcript ? (
                              <button
                                type="button"
                                onClick={() => openPreview(user.educationRecord!.transcript!)}
                                className="text-orange-600 hover:underline text-sm"
                              >
                                เปิดดู
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative inline-block">
                              {verifyStatus === 'PENDING' ? (
                                <select
                                  value={verifyStatus}
                                  onChange={(e) =>
                                    handleStatusChange(user.id, e.target.value as VerifyStatus)
                                  }
                                  // แก้ไข: ลดความกว้างเป็น 110px และใส่ text-center
                                  className={`w-[110px] appearance-none px-3 py-1 pr-6 rounded-full text-xs font-medium border-0 outline-none transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer text-center`}
                                >
                                  <option value="PENDING">รอดำเนินการ</option>
                                  <option value="APPROVED">อนุมัติแล้ว</option>
                                  <option value="REJECTED">ไม่อนุมัติ</option>
                                </select>
                              ) : (
                                <div
                                  // แก้ไข: ใช้ div + flex เพื่อ justify-center อย่างสมบูรณ์ในกรอบ 110px
                                  className={`w-[110px] px-3 py-1 rounded-full text-xs font-medium border-0 flex items-center justify-center ${
                                    verifyStatus === 'APPROVED'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {verifyStatus === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                                </div>
                              )}

                              {verifyStatus === 'PENDING' && (
                                <ChevronDown
                                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-700"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    {previewUrl && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-700">แสดงเอกสารแนบ</h2>
            <button
              onClick={closePreview}
              className="text-sm text-gray-500 hover:text-orange-600 transition"
            >ปิด</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {previewType === 'pdf' && previewUrl && (
              <iframe
                src={previewUrl || ''}
                className="w-full h-[70vh] border rounded"
                title="Transcript PDF"
              />
            )}
            {previewType === 'image' && previewUrl && (
              <img
                src={previewUrl || ''}
                alt="Transcript"
                className="max-h-[70vh] mx-auto object-contain"
              />
            )}
            {previewType === 'other' && (
              <div className="text-center text-gray-600 text-sm">
                ไม่รองรับการแสดงไฟล์นี้โดยตรง กรุณาดาวน์โหลด
                <div className="mt-4">
                  <a
                    href={previewUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >ดาวน์โหลดไฟล์</a>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t flex justify-end">
            <a
              href={previewUrl || '#'}
              download
              className="text-sm px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
            >ดาวน์โหลด</a>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
