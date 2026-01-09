'use client';

import React, { useState, useEffect, Suspense } from 'react'; 
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, PlusCircle, Camera } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/tables/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';

// Dynamically import AdminSubmissionPage client-side to avoid HMR issues with nested lucide-react icons
const AdminSubmissionPageComponent = dynamic(
  () => import('./appove/page').then(m => ({ default: m.AdminSubmissionPage })),
  { ssr: false, loading: () => <div className="bg-gray-100 rounded-lg p-8 animate-pulse min-h-[300px]" /> }
);

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
  // state สำหรับโพสต์ที่ดึงจาก DB
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);

  // ดึง Content จาก /api/content แค่ครั้งแรก
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoadingPosts(true);
        const res = await fetch('/api/content'); 
        const data = await res.json();

        if (!res.ok) {
          console.error('Error fetching contents:', data);
          return;
        }

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

  // ✅ ปรับส่วนแสดงผลตารางให้เหลือเฉพาะข้อมูลโพสต์
  const title = 'รายการโพสต์ทั้งหมด';
  const headers = ['ลำดับ', 'ชื่อกิจกรรม / เนื้อหา', 'ผู้สร้าง', 'สถานะ'];
  const data = posts.map((p) => [p.id, p.title, p.author, p.status]);

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      <AdminSubmissionPageComponent />

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
              isActive={true}
            />

            <DashboardMenuCard
              icon={PlusCircle}
              title="สร้างโพสต์ใหม่"
              link="/admin/news/create"
            />

            <DashboardMenuCard
              icon={Camera}
              title="เช็คอินเข้างาน"
              link="/admin/booking/success"
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
                {/* แสดงสถานะกำลังโหลด */}
                {loadingPosts ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="py-4 text-center text-gray-500">
                      กำลังโหลดข้อมูลโพสต์...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="py-4 text-center text-gray-500">
                      ยังไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
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

            <div className="flex justify-end px-4 py-1 text-xs text-gray-400">
              &raquo;
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}