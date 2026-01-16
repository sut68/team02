'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Search, 
  X, 
  Loader2,
  Settings,
  ChevronDown,
  MoreHorizontal // เพิ่มไอคอนสำหรับปุ่มจัดการ
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import AlertModal from '@/app/components/ui/AlertModal';
import SuccessModal from '@/app/components/ui/SuccessModal';
import ConfirmModal from '@/app/components/ui/ConfirmModal';

// --- Type Definitions ---
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
};

const fmtCurrency = (v: number) => `฿ ${v.toLocaleString('th-TH')}`;

export default function TransactionHistoryPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [success, setSuccess] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; onConfirm: (() => void) | null; message: string; isDanger?: boolean; isLoading?: boolean }>({ open: false, onConfirm: null, message: '', isDanger: false, isLoading: false });

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
      const hasBooking = !!p.bookings || !!p.bookingId;
      const hasTransaction = !!p.transaction;     
      const hasBudget = !!p.budgetDonation;       

      let donor = 'ไม่ระบุ';
      let role: Transaction['role'] = 'DONATION';
      let projectLabel = '-';
      let message = null;

      if (hasBooking) {
        role = 'BOOKING';
        donor = p.bookings?.user?.fullName ?? p.bookings?.payerName ?? 'ผู้จองกิจกรรม';
        projectLabel = p.bookings?.content?.TitleName ?? p.bookings?.bookingForm?.Type ?? 'กิจกรรม';
      } else if (hasTransaction) {
        role = 'DONATION';
        donor = p.transaction?.fullName ?? 'ผู้บริจาคทั่วไป';
        projectLabel = p.transaction?.projectId ? `โครงการ #${p.transaction.projectId}` : 'บริจาคทั่วไป';
        message = p.transaction?.message;
      } else if (hasBudget) {
        role = 'BUDGET';
        donor = p.budgetDonation?.fullName ?? 'ผู้สนับสนุนงบประมาณ';
        projectLabel = p.budgetDonation?.projectId ? `โครงการระดมทุน #${p.budgetDonation.projectId}` : 'ระดมทุน';
        message = p.budgetDonation?.message;
      }

      if (donor === 'ไม่ระบุ' || donor === 'ผู้บริจาคทั่วไป') {
        if (p.payerName) donor = p.payerName;
      }

      const rawStatus = p.paymentStatus ?? p.status ?? 'PENDING';

      return {
        id: String(p.id),
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
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
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const handleStatusChange = async (txId: string, newStatus: string) => {
    const confirmMsg = newStatus === 'SUCCESS' ? 'ยืนยันยอดเงินเรียบร้อยแล้ว?' : 'ต้องการปฏิเสธ/ยกเลิกรายการนี้?';
    setConfirm({
      open: true,
      message: confirmMsg,
      isDanger: newStatus !== 'SUCCESS',
      isLoading: false,
      onConfirm: async () => {
        setConfirm((prev) => ({ ...prev, isLoading: true }));
        setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: newStatus } : t));
        setSuccess({ show: true, message: newStatus === 'SUCCESS' ? 'อัปเดตสถานะสำเร็จ' : 'ยกเลิกรายการสำเร็จ' });
        setConfirm({ open: false, onConfirm: null, message: '', isDanger: false, isLoading: false });
      }
    });
  };

  const stats = useMemo(() => {
    let pendingCount = 0;
    let successCount = 0;
    let failedCount = 0;
    transactions.forEach((tx) => {
      if (tx.status === 'PENDING') pendingCount++;
      if (tx.status === 'SUCCESS') successCount++;
      if (tx.status === 'FAILED') failedCount++;
    });
    return { pendingCount, successCount, failedCount, totalCount: transactions.length };
  }, [transactions]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = filterStatus === 'ALL' || tx.status === filterStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = q === '' || [tx.id, tx.donor, tx.project].join(' ').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500">กำลังโหลดรายการธุรกรรม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            รายการธุรกรรม
          </h1>
          <Link href="/admin/payment/methods">
            <button className="flex items-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition shadow-sm">
              <Settings className="w-5 h-5" />
              <span className="font-medium">ช่องทางชำระเงิน</span>
            </button>
          </Link>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer border-2 transition ${filterStatus === 'ALL' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setFilterStatus('ALL')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Layers className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ทั้งหมด</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{stats.totalCount}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${filterStatus === 'PENDING' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setFilterStatus('PENDING')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">รอตรวจสอบ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{stats.pendingCount}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${filterStatus === 'SUCCESS' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setFilterStatus('SUCCESS')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">สำเร็จ</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{stats.successCount}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition ${filterStatus === 'FAILED' ? 'border-orange-300' : 'border-orange-100 hover:border-orange-200'}`}
            onClick={() => setFilterStatus('FAILED')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ยกเลิก/ล้มเหลว</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{stats.failedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อผู้โอน, รหัสธุรกรรม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">วันที่ / เวลา</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ผู้ทำรายการ</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">หลักฐาน</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">สถานะ</th>
                    {/* <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">จัดการ</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        ไม่พบข้อมูลรายการ
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-800">{tx.date}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-800 font-medium">{tx.donor}</div>
                          <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">{tx.project}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                          {fmtCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {tx.slip ? (
                            <button
                              onClick={() => setSelectedSlip(tx.slip || null)}
                              className="text-orange-600 hover:underline hover:text-orange-800 font-medium"
                            >
                              เปิดดู
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="relative inline-block">
                                {tx.status === 'PENDING' ? (
                                    <>
                                        <select
                                            value={tx.status}
                                            onChange={(e) => handleStatusChange(tx.id, e.target.value)}
                                            className="w-[110px] appearance-none px-3 py-1 pr-6 rounded-full text-xs font-medium border-0 outline-none transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer text-center"
                                        >
                                            <option value="PENDING">รอดำเนินการ</option>
                                            <option value="SUCCESS">อนุมัติ</option>
                                            <option value="FAILED">ไม่อนุมัติ</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-700" />
                                    </>
                                ) : (
                                    <div
                                        className={`w-[110px] px-3 py-1 rounded-full text-xs font-medium border-0 flex items-center justify-center ${
                                            tx.status === 'SUCCESS'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {tx.status === 'SUCCESS' ? 'สำเร็จ' : 'ไม่สำเร็จ'}
                                    </div>
                                )}
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

        {/* Modal View Slip */}
        {selectedSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setSelectedSlip(null)}>
            <div className="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-700">หลักฐานการโอนเงิน</h2>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="text-sm text-gray-500 hover:text-orange-600 transition"
                >ปิด</button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-50">
                <img
                  src={selectedSlip}
                  alt="Payment Slip"
                  className="max-h-[70vh] object-contain rounded border"
                />
              </div>
              <div className="px-6 py-3 border-t flex justify-end gap-2">
                <button 
                    onClick={() => setSelectedSlip(null)}
                    className="text-sm px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                    ตกลง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        <AlertModal
          isOpen={alert.show}
          message={alert.message}
          onClose={() => setAlert({ show: false, message: '' })}
        />
        <SuccessModal
          show={success.show}
          message={success.message}
          onClose={() => setSuccess({ show: false, message: '' })}
        />
        <ConfirmModal
          isOpen={confirm.open}
          onClose={() => !confirm.isLoading && setConfirm({ open: false, onConfirm: null, message: '', isDanger: false, isLoading: false })}
          onConfirm={confirm.onConfirm || (() => {})}
          title="ยืนยันการเปลี่ยนสถานะ"
          message={confirm.message}
          confirmLabel="ยืนยัน"
          cancelLabel="ยกเลิก"
          isDanger={confirm.isDanger}
          isLoading={confirm.isLoading}
        />
      </div>
    </div>
  );
}