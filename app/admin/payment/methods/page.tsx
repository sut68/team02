'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  X, 
  Loader2, 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Banknote,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// ใช้ Card Component เหมือนหน้าอื่น
import { Card, CardContent } from '@/app/components/ui/Card';
import AlertModal from '@/app/components/ui/AlertModal';
import SuccessModal from '@/app/components/ui/SuccessModal';

// Type Definitions
type PaymentMethod = {
  id: number;
  methodName: string; 
  accountNumber: string | null;
  provider: string | null;
  isActive: boolean;
  icon?: string;
};

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  // Confirm modal state
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

  // Alert and Success states
  const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [success, setSuccess] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // --- Data Fetching ---
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

  // --- Handlers ---
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

  const toggleStatus = (method: PaymentMethod) => {
    openConfirm({
      title: method.isActive ? 'ปิดใช้งานช่องทาง' : 'เปิดใช้งานช่องทาง',
      message: `คุณแน่ใจที่จะ ${method.isActive ? 'ปิด' : 'เปิด'} ช่องทาง "${method.provider || method.methodName}"?`,
      danger: method.isActive === true,
      onConfirm: async () => {
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
          setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' });
          closeConfirm();
        }
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId ? { ...formData, id: editingId } : formData;
      const res = await fetch('/api/payment-method', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      setIsModalOpen(false);
      setSuccess({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
      fetchMethods(); 
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: 'บันทึกข้อมูลไม่สำเร็จ' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          setSuccess({ show: true, message: 'ลบข้อมูลสำเร็จ' });
          closeConfirm();
        } catch (err) {
          console.error(err);
          setAlert({ show: true, message: 'ลบข้อมูลไม่สำเร็จ' });
          closeConfirm();
        }
      },
    });
  };

  // UI Helpers
  const getIcon = (type: string) => {
    switch (type) {
        case 'PROMPTPAY': return <Smartphone className="w-8 h-8" />;
        case 'TRUEMONEY': return <WalletIcon className="w-8 h-8" />;
        case 'BANKTRANSFER': return <Landmark className="w-8 h-8" />;
        case 'CASH': return <Banknote className="w-8 h-8" />;
        default: return <CreditCard className="w-8 h-8" />;
    }
  };

  // Custom Icon wrapper just for display
  const WalletIcon = ({className}: {className?: string}) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8Z" /></svg>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/payment" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">ช่องทางการชำระเงิน</h1>
                </div>
            </div>
            <button 
                onClick={handleOpenAdd}
                className="flex items-center space-x-2 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition shadow-sm"
            >
                <Plus className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">เพิ่มช่องทางใหม่</span>
            </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
             <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 border border-red-200 rounded-xl bg-red-50">
              พบข้อผิดพลาด: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {methods.map((method) => (
              <Card 
                key={method.id} 
                className={`transition-all duration-200 border-2 ${
                    method.isActive 
                    ? 'border-gray-200 hover:border-orange-300' 
                    : 'border-gray-100 bg-gray-50 opacity-80 hover:border-gray-300'
                }`}
              >
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                            method.isActive 
                            ? 'bg-orange-50 text-orange-600 border-orange-100' 
                            : 'bg-gray-100 text-gray-400 border-gray-200'
                        }`}>
                            {getIcon(method.methodName)}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            method.isActive 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-200 text-gray-600 border-gray-300'
                        }`}>
                            {method.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{method.provider || method.methodName}</h3>
                        <p className="text-sm text-gray-500">{method.methodName}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6 text-center">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">เลขที่บัญชี / เบอร์โทร</p>
                        <p className="text-lg font-mono font-semibold text-gray-700 tracking-wider">
                            {method.accountNumber || '-'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => toggleStatus(method)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition border ${
                                method.isActive 
                                ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600'
                            }`}
                            title={method.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                        >
                            <Power size={16} /> 
                            {method.isActive ? 'ปิด' : 'เปิด'}
                        </button>
                        
                        <div className="w-px h-6 bg-gray-200"></div>

                        <button 
                            onClick={() => handleOpenEdit(method)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="แก้ไข"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(method.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="ลบ"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Add/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">
                    {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มช่องทางใหม่'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                    <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทการชำระเงิน</label>
                  <select 
                    value={formData.methodName}
                    onChange={(e) => setFormData({...formData, methodName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-gray-700"
                  >
                    <option value="PROMPTPAY">PromptPay (พร้อมเพย์)</option>
                    <option value="BANKTRANSFER">Bank Transfer (โอนธนาคาร)</option>
                    <option value="TRUEMONEY">TrueMoney Wallet</option>
                    <option value="CASH">Cash (เงินสด)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ให้บริการ (ธนาคาร/ค่ายมือถือ)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({...formData, provider: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
                    placeholder="เช่น กสิกรไทย, พร้อมเพย์" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขที่บัญชี / เบอร์โทร</label>
                  <input 
                    type="text" 
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-mono" 
                    placeholder="xxx-x-xxxxx-x" 
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">เปิดใช้งาน</span>
                  </label>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    formData.isActive 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-gray-200 text-gray-600 border-gray-300'
                  }`}>
                    {formData.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition flex justify-center items-center"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirm.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${confirm.danger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {confirm.danger ? <Trash2 size={24} /> : <Power size={24} />}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-bold text-gray-900">{confirm.title}</h3>
                  {confirm.message && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{confirm.message}</p>}
                </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  onClick={() => closeConfirm()}
                  className="py-2.5 px-5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  disabled={confirm.loading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => { confirm.onConfirm && confirm.onConfirm(); }}
                  className={`py-2.5 px-5 rounded-xl text-sm font-medium shadow-md transition ${
                      confirm.danger 
                      ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg'
                  }`}
                  disabled={confirm.loading}
                >
                  {confirm.loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert and Success Modals */}
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
      </div>
    </div>
  );
}