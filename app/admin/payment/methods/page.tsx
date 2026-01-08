'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, X, Loader2 } from 'lucide-react';

// Type ให้ตรงกับ Prisma Model
type PaymentMethod = {
  id: number;
  methodName: string; // ENUM: PROMPTPAY, BANKTRANSFER, etc.
  accountNumber: string | null;
  provider: string | null; // ชื่อธนาคาร หรือ ชื่อผู้ให้บริการ
  isActive: boolean;
  icon?: string;
};

// ค่าเริ่มต้นสำหรับ Form
const initialFormState = {
  methodName: 'PROMPTPAY',
  provider: '',
  accountNumber: '',
  isActive: true,
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // ถ้ามีค่า = โหมดแก้ไข
  const [formData, setFormData] = useState(initialFormState);

  // Confirm modal state (ใช้สำหรับ delete / toggle)
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    onConfirm?: () => Promise<void> | void;
    loading?: boolean;
    danger?: boolean;
  }>({ open: false });

  const openConfirm = (opts: {
    title: string;
    message?: string;
    onConfirm?: () => Promise<void> | void;
    danger?: boolean;
  }) => setConfirm({ open: true, loading: false, ...opts });

  const closeConfirm = () => setConfirm({ open: false });

  // --- 1. Fetch Data ---
  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-method');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMethods(data.paymentMethods || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // --- 2. Handlers for Modal ---
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setFormData({
      methodName: method.methodName,
      provider: method.provider || '',
      accountNumber: method.accountNumber || '',
      isActive: method.isActive,
    });
    setIsModalOpen(true);
  };

  // --- 3. API Actions ---

  // A. Toggle Active Status
  const toggleStatus = (method: PaymentMethod) => {
    openConfirm({
      title: method.isActive ? 'ปิดใช้งานช่องทาง' : 'เปิดใช้งานช่องทาง',
      message: `คุณแน่ใจที่จะ ${method.isActive ? 'ปิด' : 'เปิด'} ช่องทาง "${method.provider || method.methodName}"?`,
      danger: method.isActive === true,
      onConfirm: async () => {
        // ทำ optimistic update แล้วเรียก API
        const originalMethods = [...methods];
        setConfirm((c) => ({ ...c, loading: true }));
        setMethods(prev => prev.map(m => m.id === method.id ? { ...m, isActive: !m.isActive } : m));
        try {
          const res = await fetch('/api/payment-method', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: method.id, isActive: !method.isActive }),
          });
          if (!res.ok) throw new Error('Update failed');
          closeConfirm();
        } catch (err) {
          console.error(err);
          setMethods(originalMethods);
          alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
          closeConfirm();
        }
      },
    });
  };

  // B. Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST'; // ถ้ามี ID คือแก้ไข, ไม่มีคือสร้างใหม่
      const payload = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/payment-method', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      // สำเร็จ -> ปิด Modal -> โหลดข้อมูลใหม่
      setIsModalOpen(false);
      fetchMethods(); 

    } catch (err) {
      console.error(err);
      alert('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // C. Delete (Optional)
  const handleDelete = (id: number) => {
    openConfirm({
      title: 'ลบช่องทางการชำระเงิน',
      message: 'ยืนยันการลบช่องทางนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(`/api/payment-method?id=${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          setMethods(prev => prev.filter(m => m.id !== id));
          closeConfirm();
        } catch (err) {
          console.error(err);
          alert('ลบข้อมูลไม่สำเร็จ');
          closeConfirm();
        }
      },
    });
  };

  // --- UI Helpers ---
  const getIcon = (type: string) => {
    switch (type) {
        case 'PROMPTPAY': return 'P';
        case 'TRUEMONEY': return 'T';
        case 'BANKTRANSFER': return 'B';
        case 'CASH': return 'C';
        default: return '?';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการช่องทางการชำระเงิน</h1>
            <p className="text-gray-500 text-sm">ตั้งค่าเลขบัญชีและเปิด-ปิดช่องทางรับเงิน</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
          >
            <Plus size={20} /> เพิ่มช่องทางใหม่
          </button>
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
             <Loader2 className="animate-spin mr-2" /> กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">ไม่สามารถดึงข้อมูลได้: {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {methods.map((method) => (
              <div key={method.id} className={`bg-white rounded-xl shadow-sm border p-6 relative transition-all ${!method.isActive && 'opacity-75 bg-gray-50'}`}>
                
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold ${method.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {method.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </div>

                {/* Icon & Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xl border border-orange-100">
                    {getIcon(method.methodName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{method.provider || method.methodName}</h3>
                    <p className="text-xs text-gray-500">{method.methodName}</p>
                  </div>
                </div>

                {/* Account Number */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">เลขที่บัญชี / เบอร์โทร</p>
                  <p className="text-lg font-mono font-bold text-gray-700 tracking-wider">
                    {method.accountNumber || '-'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button 
                      onClick={() => toggleStatus(method)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition
                      ${method.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    <Power size={16} /> {method.isActive ? 'ปิด' : 'เปิด'}
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(method)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Edit2 size={16} /> แก้ไข
                  </button>
                  {/* ปุ่มลบ (ถ้าต้องการ) */}
                  <button onClick={() => handleDelete(method.id)} className="px-3 py-2 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg transition">
                     <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Add/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                    {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มช่องทางใหม่'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการชำระเงิน</label>
                  <select 
                    value={formData.methodName}
                    onChange={(e) => setFormData({...formData, methodName: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="PROMPTPAY">PromptPay (พร้อมเพย์)</option>
                    <option value="BANKTRANSFER">Bank Transfer (โอนธนาคาร)</option>
                    <option value="TRUEMONEY">TrueMoney Wallet</option>
                    <option value="CASH">Cash (เงินสด)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ให้บริการ (Bank/Provider)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({...formData, provider: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500 outline-none" 
                    placeholder="เช่น กสิกรไทย, เบอร์มือถือ" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บัญชี / เบอร์โทร</label>
                  <input 
                    type="text" 
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500 outline-none" 
                    placeholder="xxx-x-xxxxx-x" 
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-2.5 border rounded-xl text-gray-600 hover:bg-gray-50 transition"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow transition flex justify-center items-center"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirm.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirm.danger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  <Trash2 />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{confirm.title}</h3>
                  {confirm.message && <p className="text-sm text-gray-500 mt-1">{confirm.message}</p>}
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => closeConfirm()}
                  className="py-2 px-4 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  disabled={confirm.loading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => { confirm.onConfirm && confirm.onConfirm(); }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium ${confirm.danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                  disabled={confirm.loading}
                >
                  {confirm.loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}