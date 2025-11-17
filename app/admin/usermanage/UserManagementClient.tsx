'use client';

import React, { useState, useEffect } from 'react';
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
          // Refresh the page to get updated data
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-medium text-gray-700 mb-8">การจัดการสมาชิก</h1>

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
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">อีเมลล์</th>
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
                          <td className="px-6 py-4">
                            <div className="relative inline-block">
                              <select
                                value={verifyStatus}
                                onChange={(e) =>
                                  handleStatusChange(user.id, e.target.value as VerifyStatus)
                                }
                                className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 outline-none cursor-pointer transition-colors ${
                                  verifyStatus === 'PENDING'
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : verifyStatus === 'APPROVED'
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <option value="PENDING">รอดำเนินการ</option>
                                <option value="APPROVED">อนุมัติแล้ว</option>
                                <option value="REJECTED">ไม่อนุมัติ</option>
                              </select>

                              <ChevronDown
                                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 ${
                                  verifyStatus === 'PENDING'
                                    ? 'text-gray-700'
                                    : verifyStatus === 'APPROVED'
                                    ? 'text-orange-700'
                                    : 'text-red-700'
                                }`}
                              />
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
  );
}
