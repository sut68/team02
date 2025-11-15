'use client';

import React, { useState } from 'react';
import { Layers, RefreshCw, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';

type MemberStatus = 'all' | 'pending' | 'approved' | 'rejected';

type Member = {
  id: string;
  name: string;
  yearType: string;
  studentId: string;
  major: string;
  educationHistory: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
};

const mockMembers: Member[] = [
  {
    id: '1',
    name: 'ธนวา กุวัสต',
    yearType: 'ศิษย์เก่า',
    studentId: 'B6610456',
    major: 'วิศวกรรมคอมพิวเตอร์',
    educationHistory: 'ปริญญาตรี 2568',
    email: 'thanwa.eng@sut.ac.th',
    status: 'pending'
  },
  {
    id: '2',
    name: 'สมชาย ใจดี',
    yearType: 'ศิษย์ปัจจุบัน',
    studentId: 'B6710234',
    major: 'วิศวกรรมไฟฟ้า',
    educationHistory: 'ปริญญาตรี ปี 3',
    email: 'somchai@sut.ac.th',
    status: 'approved'
  },
  {
    id: '3',
    name: 'สมหญิง รักเรียน',
    yearType: 'ศิษย์เก่า',
    studentId: 'B6510789',
    major: 'วิศวกรรมเครื่องกล',
    educationHistory: 'ปริญญาตรี 2567',
    email: 'somying@sut.ac.th',
    status: 'rejected'
  },
  {
    id: '4',
    name: 'วิชัย สมบูรณ์',
    yearType: 'ศิษย์เก่า',
    studentId: 'B6410123',
    major: 'วิศวกรรมโยธา',
    educationHistory: 'ปริญญาตรี 2566',
    email: 'wichai@sut.ac.th',
    status: 'approved'
  },
  {
    id: '5',
    name: 'นภา เจริญศรี',
    yearType: 'ศิษย์ปัจจุบัน',
    studentId: 'B6710567',
    major: 'วิศวกรรมอุตสาหการ',
    educationHistory: 'ปริญญาตรี ปี 2',
    email: 'napa@sut.ac.th',
    status: 'pending'
  }
];

export default function AdminManagementPage() {
  const [activeStatus, setActiveStatus] = useState<MemberStatus>('all');
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member => {
    const matchesStatus = activeStatus === 'all' || member.status === activeStatus;
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: MemberStatus) => {
    if (status === 'all') return members.length;
    return members.filter(m => m.status === status).length;
  };

  const handleStatusChange = (memberId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const statusText = newStatus === 'pending' ? 'รอดำเนินการ' : newStatus === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
    const confirmed = confirm(`คุณต้องการเปลี่ยนสถานะเป็น "${statusText}" หรือไม่?`);
    
    if (confirmed) {
      setMembers(members.map(member =>
        member.id === memberId ? { ...member, status: newStatus } : member
      ));
    }
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ปีที่จบการศึกษา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">อีเมลล์</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูลสมาชิก
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-800">{member.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.yearType}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.studentId}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.major}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.educationHistory}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                            <select
                              value={member.status}
                              onChange={(e) =>
                                handleStatusChange(member.id, e.target.value as 'pending' | 'approved' | 'rejected')
                              }
                              className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                                member.status === 'pending'
                                  ? 'bg-gray-200 text-gray-700'
                                  : member.status === 'approved'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <option value="pending">รอดำเนินการ</option>
                              <option value="approved">อนุมัติแล้ว</option>
                              <option value="rejected">ไม่อนุมัติ</option>
                            </select>

                            {/* ไอคอนลูกศรที่เราคุมตำแหน่งเองได้ */}
                            <ChevronDown
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-orange-700"
                            />
                          </div>
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

