'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, PlusCircle, Camera, Trash2, AlertTriangle } from 'lucide-react'; 
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
import SuccessModal from "../../components/ui/SuccessModal";

const AdminSubmissionPageComponent = dynamic(
  () => import('./appove/page').then(m => ({ default: m.AdminSubmissionPage })),
  { ssr: false, loading: () => <div className="bg-gray-100 rounded-lg p-8 animate-pulse min-h-[300px]" /> }
);

// --- Dashboard Menu Card Component ---
const DashboardMenuCard = ({ icon: Icon, title, link, onClick }: { icon: React.ElementType; title: string; link?: string; onClick?: () => void; }) => {
  const cardInner = (
    <div className="group rounded-3xl bg-white shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-200 py-8 px-6 cursor-pointer h-40 w-full flex flex-col items-center justify-center">
      <Icon className="w-16 h-16 text-orange-500 mb-4" strokeWidth={1.5} />
      <div className="text-base font-medium text-gray-700 text-center">{title}</div>
    </div>
  );
  return onClick ? <button onClick={onClick} className="w-full">{cardInner}</button> : <Link href={link ?? '#'} className="w-full">{cardInner}</Link>;
};

type PostRow = { id: number; title: string; author: string; status: string; };

export default function DashboardPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  
  // ✅ States สำหรับ Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ดึงข้อมูล Content
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoadingPosts(true);
        const res = await fetch('/api/content'); 
        const data = await res.json();
        if (!res.ok) return;

        const mapped: PostRow[] = (data.contents || []).map((c: any) => ({
          id: c.id,
          title: c.TitleName || '(ไม่มีชื่อเรื่อง)',
          author: c.user?.fullName || 'ไม่ระบุ',
          status: c.Booking === 'HAVE' ? 'ลงทะเบียน' : 'ไม่ลงทะเบียน',
        })).sort((a: PostRow, b: PostRow) => b.id - a.id);
        setPosts(mapped);
      } catch (err) { console.error(err); } finally { setLoadingPosts(false); }
    };
    fetchContents();
  }, []);

  // ✅ 1. เมื่อกดปุ่มถังขยะ
  const openConfirmModal = (id: number) => {
    setSelectedId(id);
    setShowConfirmModal(true);
  };

  // ✅ 2. เมื่อกดยืนยันลบ
  const handleDeletePost = async () => {
    if (!selectedId) return;
    
    // ปิดตัวยืนยันก่อนเพื่อเคลียร์หน้าจอ
    setShowConfirmModal(false); 

    try {
      const res = await fetch(`/api/content?id=${selectedId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== selectedId));
        setModalMsg("ลบเนื้อหาสำเร็จเรียบร้อยแล้ว");
      } else {
        setModalMsg(data.error || "ไม่สามารถลบข้อมูลได้ในขณะนี้");
      }
    } catch (error) {
      setModalMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSelectedId(null);
      // หน่วงเวลาเล็กน้อยเพื่อให้ Modal เดิมหายไปก่อนเปิด Modal ใหม่
      setTimeout(() => setShowSuccessModal(true), 100);
    }
  };

  const headers = ['ลำดับ', 'ชื่อกิจกรรม / เนื้อหา', 'ผู้สร้าง', 'สถานะ', 'จัดการ'];

  return (
    <div className="container mx-auto px-4 py-10 space-y-12 relative">
      
      {/* Success Modal (สีส้ม) */}
      <SuccessModal 
        show={showSuccessModal} 
        message={modalMsg} 
        onClose={() => setShowSuccessModal(false)} 
      />

      {/* ✅ Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการลบ?</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้? <br/>การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowConfirmModal(false); setSelectedId(null); }} 
                className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleDeletePost} 
                className="flex-1 py-3 px-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSubmissionPageComponent />

      <Card className="shadow-sm rounded-xl border-none">
        <CardHeader>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">แดชบอร์ดข่าวสารและกิจกรรม</h2>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardMenuCard icon={FileText} title="โพสต์ทั้งหมด" />
            <DashboardMenuCard icon={PlusCircle} title="สร้างโพสต์ใหม่" link="/admin/news/create" />
            <DashboardMenuCard icon={Camera} title="เช็คอินเข้างาน" link="/admin/booking/success" />
          </div>

          <div className="space-y-3 pt-6">
            <h3 className="text-xl font-medium text-gray-800">รายการโพสต์ทั้งหมด</h3>
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
                  <TableRow><TableCell colSpan={5} className="py-10 text-center">กำลังโหลดข้อมูลโพสต์...</TableCell></TableRow>
                ) : posts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center">ยังไม่มีข้อมูล</TableCell></TableRow>
                ) : (
                  posts.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>{p.author}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'ลงทะเบียน' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => openConfirmModal(p.id)}
                          className="p-2 text-gray-400 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}