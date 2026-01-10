'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, PlusCircle, Camera, Trash2 } from 'lucide-react'; // ✅ เพิ่ม Trash2
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/tables/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { ERROR_MESSAGES } from '@/lib/models/validation'; 

// Dynamically import AdminSubmissionPage
const AdminSubmissionPageComponent = dynamic(
  () => import('./appove/page').then(m => ({ default: m.AdminSubmissionPage })),
  { ssr: false, loading: () => <div className="bg-gray-100 rounded-lg p-8 animate-pulse min-h-[300px]" /> }
);

// ----------------------------------------------------------------------
// Dashboard Menu Card (เหมือนเดิม)
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
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);

  // ดึง Content
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
        .sort((a: PostRow, b: PostRow) => b.id - a.id); // เรียงใหม่ไปเก่า (desc)

        setPosts(mapped);
      } catch (err) {
        console.error('Unexpected error fetching contents:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchContents();
  }, []);

  // ✅ ฟังก์ชันลบโพสต์
  const handleDeletePost = async (id: number) => {
    // 1. Confirm ก่อนลบ
    if (!confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    try {
      // 2. ยิง API Delete
      const res = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || ERROR_MESSAGES.DB_ERROR);
        return;
      }

      // 3. ลบสำเร็จ -> เอาออกจาก State หน้าจอทันที (ไม่ต้องโหลดใหม่)
      setPosts((prev) => prev.filter((p) => p.id !== id));
      alert(ERROR_MESSAGES.DELETE_SUCCESS || "ลบเนื้อหาสำเร็จ");

    } catch (error) {
      console.error(error);
      alert(ERROR_MESSAGES.DB_ERROR || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const title = 'รายการโพสต์ทั้งหมด'
  const headers = ['ลำดับ', 'ชื่อกิจกรรม / เนื้อหา', 'ผู้สร้าง', 'สถานะ', 'จัดการ'];
  
  // ✅ Map ข้อมูลพร้อมปุ่มลบ
  const data = posts.map((p, index) => [
    index + 1, // ลำดับที่ (Running Number)
    p.title,
    p.author,
    <span key="status" className={`px-2 py-1 rounded-full text-xs ${p.status === 'ลงทะเบียน' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
      {p.status}
    </span>,
    <button
      key="delete-btn"
      onClick={() => handleDeletePost(p.id)}
      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
      title="ลบโพสต์"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  ]);

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
                    <TableHead key={idx} className={idx === headers.length - 1 ? "text-center" : ""}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
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
                        <TableCell 
                          key={cellIdx} 
                          className={`
                            ${cellIdx === 0 ? 'font-medium' : ''}
                            ${cellIdx === headers.length - 1 ? 'text-center' : ''} 
                          `}
                        >
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