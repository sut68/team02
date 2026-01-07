'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle, XCircle, Search, Calendar, FileText, Download, X } from 'lucide-react';

// ปรับ Transaction type เล็กน้อย ให้รองรับฟิลด์ fallback จาก API
type Transaction = {
  id: string;
  date: string;
  donor: string;
  project: string;
  amount: number;
  slip?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  role?: 'DONATION' | 'BOOKING' | 'BUDGET';
  message?: string | null;
  createdAt?: string | null;
  // ...additional optional raw fields if needed...
};

export default function TransactionHistoryPage() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // ดึงข้อมูลจาก /api/payment เมื่อ component โหลด
  useEffect(() => {
    const ac = new AbortController();

    const mapStatus = (s?: string) => {
      if (!s) return 'PENDING';
      const up = s.toUpperCase();
      if (up === 'CONFIRMED') return 'SUCCESS';
      if (up === 'CANCELLED' || up === 'REFUNDED') return 'FAILED';
      if (['SUCCESS', 'PENDING', 'FAILED'].includes(up)) return up;
      return 'PENDING';
    };

    const mapPaymentToTransaction = (p: any): Transaction => {
      // 1. ตรวจสอบว่า payment นี้ผูกกับอะไรบ้าง
      const hasBooking = !!p.bookings || !!p.bookingId;
      const hasTransaction = !!p.transaction;     // สำหรับ DonationTransaction
      const hasBudget = !!p.budgetDonation;       // สำหรับ BudgetDonation

      let donor = 'ไม่ระบุ';
      let role: Transaction['role'] = 'DONATION';
      let projectLabel = '-';
      let message = null;

      // 2. ดึงข้อมูลตามลำดับความสำคัญ (Priority)
      if (hasBooking) {
        role = 'BOOKING';
        // สมมติโครงสร้าง Booking (ปรับตาม Booking Model ของคุณ)
        donor = p.bookings?.user?.fullName ?? p.bookings?.payerName ?? 'ผู้จองกิจกรรม';
        projectLabel = p.bookings?.content?.TitleName ?? p.bookings?.bookingForm?.Type ?? 'กิจกรรม';

      } else if (hasTransaction) {
        role = 'DONATION';
        // ดึงจาก DonationTransaction
        donor = p.transaction?.fullName ?? 'ผู้บริจาคทั่วไป';
        projectLabel = p.transaction?.projectId ? `โครงการ #${p.transaction.projectId}` : 'บริจาคทั่วไป';
        message = p.transaction?.message;

      } else if (hasBudget) {
        role = 'BUDGET';
        // ดึงจาก BudgetDonation
        donor = p.budgetDonation?.fullName ?? 'ผู้สนับสนุนงบประมาณ';
        projectLabel = p.budgetDonation?.projectId ? `โครงการระดมทุน #${p.budgetDonation.projectId}` : 'ระดมทุน';
        message = p.budgetDonation?.message;
      }

      // Fallback: ถ้ายังไม่ได้ชื่อ ให้ลองดูที่ root level (เผื่อมี field เสริม)
      if (donor === 'ไม่ระบุ' || donor === 'ผู้บริจาคทั่วไป') {
        if (p.payerName) donor = p.payerName;
      }

      // 3. Status Mapping (ใช้ฟังก์ชัน mapStatus เดิม)
      const rawStatus = p.paymentStatus ?? p.status ?? 'PENDING';

      return {
        id: String(p.id), // ใช้ Payment ID เป็นหลัก
        date: p.createdAt ? new Date(p.createdAt).toLocaleString('th-TH') : '',
        createdAt: p.createdAt ?? null,
        donor: donor,
        project: projectLabel,
        amount: typeof p.amount === 'number' ? p.amount : Number(p.amount ?? 0),
        slip: p.paymentSlipUrl ?? null,
        status: mapStatus(rawStatus),
        role,
        message: message ?? null,
      };
    };

    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/payment', { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();

        const payload = body?.data ?? [];
        const list = Array.isArray(payload) ? payload : (payload ? [payload] : []);
        setTransactions(list.map(mapPaymentToTransaction));
        setError(null);
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // คำนวณสถิติแบบ memoized
  const stats = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    let pending = 0;
    let today = 0;
    let monthCount = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      const created = tx.createdAt ? new Date(tx.createdAt) : null;

      if (tx.status === 'PENDING') pending += amt;
      if (tx.status === 'SUCCESS' && created && created >= startOfToday && created < startOfTomorrow) today += amt;
      if (created && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) monthCount++;
    });

    return { pending, today, monthCount };
  }, [transactions]);

  const fmtCurrency = (v: number) => `฿ ${v.toLocaleString('th-TH')}`;

  // กรองรายการโดยสถานะและคำค้นหา
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = filterStatus === 'ALL' || tx.status === filterStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = q === '' || [tx.id, tx.donor, tx.project].join(' ').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center w-fit gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> รอตรวจสอบ</span>;
      case 'SUCCESS': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">ยืนยันแล้ว</span>;
      case 'FAILED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">ยกเลิก/ไม่สำเร็จ</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
            <p className="text-gray-500 text-sm">ยอดเงินรอตรวจสอบ</p>
            <p className="text-3xl font-bold text-orange-600">{loading ? '—' : fmtCurrency(stats.pending)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">ยอดบริจาควันนี้</p>
            <p className="text-3xl font-bold text-gray-800">{loading ? '—' : fmtCurrency(stats.today)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">จำนวนรายการ (เดือนนี้)</p>
            <p className="text-3xl font-bold text-gray-800">{loading ? '—' : `${stats.monthCount} รายการ`}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-t-xl border-b flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>ทั้งหมด</button>
            <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>รอตรวจสอบ</button>
            <button onClick={() => setFilterStatus('SUCCESS')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>สำเร็จ</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสธุรกรรม..."
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-orange-500 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link
              href="/admin/payment/methods"
              aria-label="จัดการช่องทางการชำระเงิน"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              <Eye size={14} /> จัดการช่องทางการชำระเงิน
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm border rounded-b-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">วันที่ / เวลา</th>
                <th className="p-4 font-semibold">รหัสธุรกรรม</th>
                <th className="p-4 font-semibold">ผู้บริจาค/ผู้จอง</th>
                <th className="p-4 font-semibold text-right">จำนวนเงิน</th>
                <th className="p-4 font-semibold text-center">หลักฐาน</th>
                <th className="p-4 font-semibold">สถานะ</th>
                <th className="p-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>

            {/* tbody: แสดง loading / error / empty / rows ที่กรองแล้ว */}
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-600">กำลังโหลด...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-600">เกิดข้อผิดพลาด: {error}</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">ไม่พบรายการที่ค้นหา</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 text-sm text-gray-600">{tx.date}</td>
                    <td className="p-4 text-sm font-mono text-gray-500">{tx.id}</td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-800">
                        {tx.donor}
                        {tx.role === 'BOOKING' && (
                          <span className="ml-2 inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">ผู้จอง</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{tx.project}</p>
                      {tx.message && (
                        <p className="text-xs text-gray-400 italic mt-1">{tx.message}</p>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">฿{(typeof tx.amount === 'number' ? tx.amount : Number(tx.amount)).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      {tx.slip ? (
                        <button
                          onClick={() => setSelectedSlip(tx.slip || null)}
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                        >
                          <FileText size={14} /> ดูสลิป
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4">
                      {tx.status === 'PENDING' ? (
                        <div className="flex justify-center gap-2">
                          <button className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="ยืนยัน"><CheckCircle size={18} /></button>
                          <button className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200" title="ปฏิเสธ"><XCircle size={18} /></button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-300"><CheckCircle size={18} className="mx-auto" /></div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal ดูสลิป */}
        {selectedSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedSlip(null)}>
            <div className="bg-white p-2 rounded-lg max-w-lg w-full relative shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-2 border-b mb-2">
                <h3 className="font-bold">หลักฐานการโอนเงิน</h3>
                <button onClick={() => setSelectedSlip(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
              </div>
              <img src={selectedSlip} alt="Slip" className="w-full h-auto rounded" />
              <div className="p-2 flex gap-2 mt-2">
                <button className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold">ยืนยันยอดเงินนี้</button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">ตรวจสอบภายหลัง</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}