// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; 
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/tables/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';

import { AdminSubmissionPage } from '../../admin/news/appove/page';
import { FileText, PlusCircle, List } from 'lucide-react';

// ----------------------------------------------------------------------
// Dashboard Menu Card
// ----------------------------------------------------------------------
const DashboardMenuCard = ({
  icon: Icon,
  title,
  link,
  onClick,
  isActive = false,
}: {
  icon: React.ElementType;
  title: string;
  link?: string;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const activeRing = isActive ? 'ring-2 ring-orange-500 ring-offset-2' : '';

  const cardInner = (
    <Card className={`hover:shadow-xl transition duration-300 cursor-pointer h-40 w-full ${activeRing}`}>
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <div className="p-3 mb-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-500">
          <Icon className="w-8 h-8" />
        </div>
        <p className="text-base font-medium text-gray-700 text-center">
          {title}
        </p>
      </CardContent>
    </Card>
  );

  if (onClick)
    return (
      <button type="button" onClick={onClick} className="w-full">
        {cardInner}
      </button>
    );

  return (
    <Link href={link ?? '#'} className="w-full">
      {cardInner}
    </Link>
  );
};

// ----------------------------------------------------------------------
// Mock Data (ยังใช้เฉพาะฝั่ง registrations)
// ----------------------------------------------------------------------
const mockAllRegistrationData = [
  { id: 1, name: 'งานเลี้ยงรุ่นวิศวกรรมคอมพิวเตอร์', registrations: 120 },
  { id: 2, name: 'โครงการฝึกอบรมเชิงปฏิบัติการ AI', registrations: 45 },
  { id: 3, name: 'แข่งขัน DSA Mascot Contest 2025', registrations: 89 },
];

type ViewType = 'all_registrations' | 'all_posts' | 'joined_registrations';

// row ที่ใช้ render ในตาราง “โพสต์ทั้งหมด”
type PostRow = {
  id: number;
  title: string;
  author: string;
  status: string;
};

// ----------------------------------------------------------------------
// Dashboard Page
// ----------------------------------------------------------------------
export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewType>('all_registrations');

  //  state สำหรับโพสต์ที่ดึงจาก DB
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);

  //  ดึง Content จาก /api/content แค่ครั้งแรก
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoadingPosts(true);
        const res = await fetch('/api/content'); // ใช้ API ที่ bro สร้าง
        const data = await res.json();

        if (!res.ok) {
          console.error('Error fetching contents:', data);
          return;
        }

        // map ข้อมูลจาก Content ให้มาอยู่ในรูป PostRow
        const mapped: PostRow[] = (data.contents || []).map((c: any) => ({
          id: c.id,
          title: c.TitleName || '(ไม่มีชื่อเรื่อง)',
          author: c.user?.fullName || 'ไม่ระบุ',
          status: c.Booking === 'HAVE' ? 'ลงทะเบียน' : 'ไม่ลงทะเบียน',
        }))
        .sort((a: PostRow, b: PostRow) => a.id - b.id);

        setPosts(mapped);
      } catch (err) {
        console.error('Unexpected error fetching contents:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchContents();
  }, []);

  const renderTableContent = () => {
    switch (currentView) {
      case 'all_posts':
        return {
          title: 'รายการโพสต์ทั้งหมด',
          headers: ['ลำดับ', 'ชื่อกิจกรรม / เนื้อหา', 'ผู้สร้าง', 'สถานะ'],
          data: posts.map((p) => [p.id, p.title, p.author, p.status]),
        };

      case 'joined_registrations':
        return {
          title: 'รายการลงทะเบียนที่ผู้ใช้เข้าร่วม',
          headers: ['ลำดับ', 'ชื่อกิจกรรม', 'จำนวนผู้ลงทะเบียน'],
          data: mockAllRegistrationData
            .filter((r) => r.id === 1)
            .map((r) => [r.id, r.name, r.registrations]),
        };

      default:
        return {
          title: 'รายการลงทะเบียนทั้งหมด',
          headers: ['ลำดับ', 'ชื่อกิจกรรม', 'จำนวนผู้ลงทะเบียน'],
          data: mockAllRegistrationData.map((r) => [r.id, r.name, r.registrations]),
        };
    }
  };

  const { title, headers, data } = renderTableContent();

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      {/* --------------------------------------------------------------- */}
      {/*       ⬆️  Admin Submission Section (ยังคงอยู่ด้านบน)        */}
      {/* --------------------------------------------------------------- */}
      <AdminSubmissionPage />

      {/* --------------------------------------------------------------- */}
      {/*       ⬇️  Dashboard Section (หน้าใหม่สไตล์เดียว Submission) */}
      {/* --------------------------------------------------------------- */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <h2 className="text-2xl font-medium text-gray-800">
            แดชบอร์ดข่าวสารและกิจกรรม
          </h2>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* เมนูด้านบน */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardMenuCard
              icon={FileText}
              title="โพสต์ทั้งหมด"
              onClick={() => setCurrentView('all_posts')}
              isActive={currentView === 'all_posts'}
            />

            <DashboardMenuCard
              icon={PlusCircle}
              title="สร้างโพสต์ใหม่"
              link="/admin/news/create"
            />

            <DashboardMenuCard
              icon={List}
              title="รายการลงทะเบียนทั้งหมด"
              onClick={() => setCurrentView('all_registrations')}
              isActive={currentView === 'all_registrations'}
            />
          </div>

          {/* ตาราง */}
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-gray-800">{title}</h3>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {headers.map((h, idx) => (
                    <TableHead key={idx}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* แสดงสถานะกำลังโหลดเฉพาะตอนอยู่หน้าโพสต์ทั้งหมด */}
                {currentView === 'all_posts' && loadingPosts && (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="py-4 text-gray-500">
                      กำลังโหลดข้อมูลโพสต์...
                    </TableCell>
                  </TableRow>
                )}

                {!loadingPosts && data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="py-4 text-gray-500">
                      ยังไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  !loadingPosts &&
                  data.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} className={cellIdx === 0 ? 'font-medium' : ''}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* ลูกศรล่างให้เหมือนกัน */}
            <div className="flex justify-end px-4 py-1 text-xs text-gray-400">
              &raquo;
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}