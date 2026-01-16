'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// แก้ไขการนำเข้า Icon บางตัวที่อาจมีปัญหา HMR และเพิ่ม CheckCircle เข้ามา
import { 
  Wallet, Check, Store, Landmark, X, 
  Loader2, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import { PaymentMethodRecord, PaymentMethodType } from '@prisma/client';
import ConfirmModal from '../../components/ui/ConfirmModal';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const METHOD_DISPLAY_MAP: Record<string, { name: string; icon: React.ReactNode }> = {
  [PaymentMethodType.PROMPTPAY]: { 
    name: "Prompt Pay", 
    icon: <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-md font-bold text-lg">P</div> 
  },
  [PaymentMethodType.CASH]: { 
    name: "เงินสด (Cash)", 
    icon: <Store className="w-10 h-10 text-orange-500" /> 
  },
  [PaymentMethodType.BANKTRANSFER]: { 
    name: "โอนบัญชีธนาคาร", 
    icon: <Landmark className="w-10 h-10 text-orange-500" /> 
  },
};

interface PaymentClientProps {
  transaction: {
    paymentId: number;
    amount: number;
    projectTitle: string;
    refNo: string;
    status: string;
    createdAt: Date;
  };
  paymentMethods: PaymentMethodRecord[];
}

export default function PaymentClient({ transaction, paymentMethods }: PaymentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
    paymentMethods.length > 0 ? paymentMethods[0].id : null
  );
  const [viewState, setViewState] = useState<'QR' | 'DETAILS' | 'CASH' | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(transaction.status === 'EXPIRED');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: (() => void) | null; message: string; isLoading?: boolean }>({ open: false, onConfirm: null, message: '', isLoading: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  useEffect(() => {
    if (isSuccess || isExpired) return;
    const createdTime = new Date(transaction.createdAt).getTime();
    const expireTime = createdTime + (15 * 60 * 1000);

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expireTime - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        handleExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    const initialDiff = Math.floor((expireTime - Date.now()) / 1000);
    setTimeLeft(initialDiff > 0 ? initialDiff : 0);
    return () => clearInterval(interval);
  }, [transaction.createdAt, isSuccess, isExpired]);

  const handleExpire = async () => {
    if (isExpired) return;
    setIsExpired(true);
    try {
      await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: transaction.paymentId, status: 'EXPIRED' })
      });
    } catch (error) { console.error("Error updating expired status:", error); }
  };

  const handleProceed = async () => {
    if (!currentMethod) return;
    setQrCodeUrl(null); setSlipFile(null); setSlipPreview(null);

    if (currentMethod.methodName === PaymentMethodType.PROMPTPAY) {
      try {
        const recipient = currentMethod.accountNumber || '';
        if (!recipient) { alert('ไม่พบเบอร์ PromptPay'); return; }
        const payload = generatePayload(recipient, { amount: transaction.amount });
        const url = await qrcode.toDataURL(payload);
        setQrCodeUrl(url);
        setViewState('QR');
      } catch (error) { console.error('Error QR:', error); }
    } else if (currentMethod.methodName === PaymentMethodType.CASH) {
      setViewState('CASH');
    } else {
      setViewState('DETAILS');
    }
  };

  const handleConfirmPayment = async () => {
    if (!slipFile) { alert("กรุณาแนบสลิปการโอนเงิน"); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", slipFile);
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadResponse.ok) throw new Error("อัปโหลดสลิปไม่สำเร็จ");
      const uploadResult = await uploadResponse.json();

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: transaction.paymentId,
          status: 'CONFIRMED',
          slipUrl: uploadResult.url
        })
      });
      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการยืนยัน');
      setIsSuccess(true);
      setTimeout(() => router.push('/user/donation'), 3000);
    } catch (error: any) {
      alert(error.message);
      setIsSubmitting(false);
    }
  };

  // --- ฟังก์ชันใหม่สำหรับยืนยันการจ่ายเงินสด ---
  const handleConfirmCash = async () => {
    setConfirmModal({ open: true, onConfirm: doConfirmCash, message: 'คุณต้องการยืนยันการจองชำระเงินสดหรือไม่?', isLoading: false });
  };

  const doConfirmCash = async () => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: transaction.paymentId,
          status: 'PENDING',
          note: 'ชำระเงินสดที่สมาคม'
        })
      });
      if (!response.ok) throw new Error('ไม่สามารถบันทึกข้อมูลได้');
      setIsSuccess(true);
      setConfirmModal({ open: false, onConfirm: null, message: '', isLoading: false });
      setTimeout(() => router.push('/user/donation'), 3000);
    } catch (error: any) {
      alert(error.message);
      setConfirmModal({ open: false, onConfirm: null, message: '', isLoading: false });
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setViewState(null); setQrCodeUrl(null); setSlipFile(null); setSlipPreview(null);
  };

  // เพิ่ม redirect ถ้ามาจาก booking
  useEffect(() => {
    if (isSuccess) {
      const bookingId = searchParams?.get('bookingId');
      if (bookingId) {
        setTimeout(() => {
          router.push(`/user/booking/success?bookingId=${bookingId}`);
        }, 3000);
      } else {
        setTimeout(() => {
          router.push('/user/donation');
        }, 3000);
      }
    }
  }, [isSuccess, router, searchParams]);

  if (isExpired) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="bg-white p-10 rounded-2xl shadow-xl text-center"><X className="w-10 h-10 text-red-600 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">รายการหมดอายุ</h2><button onClick={() => router.push('/user/donation')} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg">กลับสู่หน้าแรก</button></div></div>;
  if (isSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">บันทึกข้อมูลสำเร็จ!</h2>
        <p className="text-gray-500">
          {searchParams?.get('bookingId')
            ? 'กำลังกลับไปยังหน้าการจอง...'
            : 'กำลังกลับสู่หน้ารายการ...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-700 pb-10">
      <main className="w-full max-w-none px-0 pt-10">
        
        {/* Header & Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-4 xl:px-24">
          <div className="flex items-center gap-2">
            <Wallet className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">ชำระเงิน</h2>
          </div>
          <div className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 shadow-sm text-lg font-semibold ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
            <Clock className="w-6 h-6" />
            <span>เวลาที่เหลือ: <span className="text-2xl font-mono font-bold ml-2">{formatTime(timeLeft)}</span></span>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="w-full flex flex-col items-center px-4 xl:px-24 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">เลือกวิธีการชำระเงิน</h3>
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethodId === method.id;
              const displayInfo = METHOD_DISPLAY_MAP[method.methodName] || { name: method.provider || method.methodName, icon: <Wallet /> };
              return (
                <button
                  key={method.id}
                  disabled={isSubmitting || !!viewState}
                  onClick={() => { setSelectedMethodId(method.id); handleReset(); }}
                  className={`relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 transition-all shadow-md h-48 w-full ${isSelected ? "border-orange-500 ring-4 ring-orange-100" : "border-gray-200 hover:border-orange-300"}`}
                >
                  {isSelected && <div className="absolute top-3 right-3 bg-orange-500 text-white rounded-full p-1"><Check className="w-4 h-4" /></div>}
                  <div className="mb-3 scale-110">{displayInfo.icon}</div>
                  <span className="text-lg font-bold text-gray-800">{displayInfo.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex justify-center px-4 xl:px-24">
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
              
              {!viewState ? (
                <div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl mb-6 text-sm text-orange-800">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">เงื่อนไขการชำระเงิน</p>
                      <p>กรุณาตรวจสอบยอดเงินให้ถูกต้องและชำระภายในเวลาที่กำหนด หากเกินเวลาหรือยอดเงินไม่ถูกต้อง รายการอาจถูกยกเลิก</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">สรุปยอดชำระเงิน</h3>
                    <div className="mb-2 text-base text-gray-700">สำหรับ: <span className="font-semibold text-orange-700">{transaction.projectTitle}</span></div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg text-gray-700 font-medium">ยอดชำระสุทธิ</span>
                      <span className="text-3xl font-bold text-orange-600">{transaction.amount.toLocaleString()} <span className="text-base text-gray-400 font-normal">THB</span></span>
                    </div>
                  </div>
                  <button
                    onClick={handleProceed}
                    className="w-full mt-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-xl"
                  >
                    {currentMethod?.methodName === PaymentMethodType.PROMPTPAY ? <><Wallet className="w-6 h-6" /> สร้าง QR Code</> : 'ดำเนินการต่อ'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                  <div className="w-full border-gray-100 pt-6">
                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl mb-6 text-sm text-orange-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold mb-1">เงื่อนไขการชำระเงิน</p>
                        <p>กรุณาตรวจสอบยอดเงินให้ถูกต้องและชำระภายในเวลาที่กำหนด</p>
                      </div>
                    </div>

                    <div className="flex flex-col border-b-2 items-start mb-8 px-2">
                      <span className="text-gray-500 text-base mb-1">สำหรับ: <span className="font-semibold text-orange-700">{transaction.projectTitle}</span></span>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-gray-500 text-lg font-medium">ยอดชำระสุทธิ</span>
                        <span className="text-4xl font-bold text-orange-600">{transaction.amount.toLocaleString()} <span className="text-xl text-gray-400 font-normal">THB</span></span>
                      </div>
                    </div>

                    {/* QR Display */}
                    {viewState === 'QR' && qrCodeUrl && (
                      <div className="mb-6 text-center">
                        <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm inline-block">
                          <img src={qrCodeUrl} alt="Payment QR" className="w-64 h-64 object-contain mix-blend-multiply" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-gray-700">
                          {currentMethod?.provider}: <span className="text-orange-600 font-bold">{currentMethod?.accountNumber}</span>
                        </p>
                      </div>
                    )}

                    {/* Bank Transfer Details */}
                    {viewState === 'DETAILS' && (
                      <div className="w-full bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                        <div className="space-y-4">
                          <div className="flex justify-between"><span className="text-gray-500">ธนาคาร</span><span className="font-bold">{currentMethod?.provider}</span></div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">เลขที่บัญชี</span>
                            <span className="text-2xl font-mono font-bold text-orange-600 bg-white px-2 py-1 rounded border">
                              {currentMethod?.accountNumber}
                              <button
                                type="button"
                                className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded"
                                onClick={() => navigator.clipboard.writeText(currentMethod?.accountNumber || '')}
                              >คัดลอก</button>
                            </span>
                          </div>
                          <div className="flex justify-between"><span className="text-gray-500">ชื่อบัญชี</span><span className="font-medium">สมาคมศิษย์เก่า</span></div>
                        </div>
                      </div>
                    )}

                    {/* Cash Details with Confirm Button */}
                    {viewState === 'CASH' && (
                      <div className="w-full space-y-6">
                        <div className="bg-orange-50 p-8 rounded-xl border border-orange-100 text-center">
                          <Store className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                          <h4 className="text-xl font-bold text-orange-600">ติดต่อชำระเงินที่สมาคม</h4>
                          <p className="text-gray-600 mt-2">กรุณาแจ้งรหัสอ้างอิงนี้ต่อเจ้าหน้าที่:</p>
                          <div className="text-3xl font-mono font-black text-gray-800 mt-2 bg-white py-2 rounded shadow-inner">{transaction.refNo}</div>
                        </div>
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={handleReset}
                            className="w-1/2 py-4 rounded-xl border border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                          >
                            ย้อนกลับ
                          </button>
                          <button 
                            onClick={handleConfirmCash} 
                            disabled={isSubmitting}
                            className="w-1/2 py-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "ยืนยันการจองชำระเงินสด"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload Section for QR/Bank */}
                    {(viewState === 'QR' || viewState === 'DETAILS') && (
                      <div className="space-y-4">
                        <div
                          className="w-full flex flex-col items-center"
                          onClick={() => !slipPreview && fileInputRef.current?.click()}
                          style={{ cursor: !slipPreview ? 'pointer' : 'default' }}
                        >
                          <div
                            className="w-full border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-400"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/gif"
                              />
                              <div className="flex flex-col items-center">
                                {slipPreview ? (
                                  <div className="relative w-48 h-48">
                                    {/* ใช้ <img> แทน <Image> ของ next/image เพื่อความเข้ากันได้ */}
                                    <img src={slipPreview} alt="Image Preview" className="object-contain w-full h-full" />
                                  </div>
                                ) : (
                                  <>
                                    <svg
                                      className="w-10 h-10 text-gray-300"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeWidth="2"
                                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4-4m0 0l-4 4m4-4v12"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-400 mt-2">อัปโหลดไฟล์</p>
                                    <p className="text-xs text-gray-400">
                                      รองรับไฟล์เอกสาร JPEG / PNG / GIF
                                    </p>
                                  </>
                                )}
                                {slipFile && (
                                  <p className="text-xs text-gray-600 mt-1">{slipFile.name}</p>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <button onClick={handleReset} disabled={isSubmitting} className="col-span-1 py-4 rounded-xl border border-gray-300 font-bold hover:bg-gray-50 transition-colors">ย้อนกลับ</button>
                          <button 
                            onClick={handleConfirmPayment} 
                            disabled={!slipFile || isSubmitting} 
                            className={`col-span-2 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${!slipFile || isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "แจ้งชำระเงิน"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => !confirmModal.isLoading && setConfirmModal({ open: false, onConfirm: null, message: '', isLoading: false })}
          onConfirm={confirmModal.onConfirm || (() => {})}
          title="ยืนยันการจองชำระเงินสด"
          message={confirmModal.message}
          confirmLabel="ยืนยัน"
          cancelLabel="ยกเลิก"
          isDanger={false}
          isLoading={confirmModal.isLoading}
        />
      </main>
    </div>
  );
}