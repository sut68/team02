'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Check, Store, Landmark, UploadCloud, X, Loader2, Clock, AlertCircle } from 'lucide-react';
import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import { PaymentMethodRecord, PaymentMethodType } from '@prisma/client';

// Helper: Format Time mm:ss
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const METHOD_DISPLAY_MAP: Record<string, { name: string; icon: React.ReactNode }> = {
  [PaymentMethodType.PROMPTPAY]: { name: "Prompt Pay", icon: <div className="w-10 h-10 bg-blue-900 text-white flex items-center justify-center rounded-md font-bold text-lg">P</div> },
  [PaymentMethodType.CASH]: { name: "เงินสด (Cash)", icon: <Store className="w-10 h-10 text-gray-600" /> },
  [PaymentMethodType.BANKTRANSFER]: { name: "โอนบัญชีธนาคาร", icon: <Landmark className="w-10 h-10 text-purple-600" /> },
};

interface PaymentClientProps {
  transaction: {
    paymentId: number;
    amount: number;
    projectTitle: string;
    refNo: string;
    status: string;
    createdAt: Date; // ✅ ต้องมี field นี้เพื่อคำนวณเวลา
  };
  paymentMethods: PaymentMethodRecord[];
}

export default function PaymentClient({ transaction, paymentMethods }: PaymentClientProps) {
  const router = useRouter();
  
  // State
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
    paymentMethods.length > 0 ? paymentMethods[0].id : null
  );
  
  // viewState: null = summary, 'QR' = promptpay qr, 'DETAILS' = bank details, 'CASH' = cash instruction
  const [viewState, setViewState] = useState<'QR' | 'DETAILS' | 'CASH' | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  
  // Loading & Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(transaction.status === 'EXPIRED');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  // --- 1. Countdown Logic (15 Minutes) ---
  useEffect(() => {
    if (isSuccess || isExpired) return;

    const createdTime = new Date(transaction.createdAt).getTime();
    const expireTime = createdTime + (15 * 60 * 1000); // 15 นาที

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expireTime - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        handleExpire(); // เรียกฟังก์ชันหมดเวลา
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    // Set initial time
    const initialDiff = Math.floor((expireTime - Date.now()) / 1000);
    setTimeLeft(initialDiff > 0 ? initialDiff : 0);

    return () => clearInterval(interval);
  }, [transaction.createdAt, isSuccess, isExpired]);

  // Handle Expiration
  const handleExpire = async () => {
    if (isExpired) return;
    setIsExpired(true);
    
    try {
        await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentId: transaction.paymentId,
                status: 'EXPIRED'
            })
        });
    } catch (error) {
        console.error("Error updating expired status:", error);
    }
  };

  // --- 2. Handle Proceed Button ---
  const handleProceed = async () => {
    if (!currentMethod) return;

    // Reset old states
    setQrCodeUrl(null);
    setSlipFile(null);
    setSlipPreview(null);

    // Logic ตามประเภทการชำระเงิน
    if (currentMethod.methodName === PaymentMethodType.PROMPTPAY) {
      try {
        const recipient = currentMethod.accountNumber || '';
        if (!recipient) {
          alert('ไม่พบเบอร์ PromptPay ในระบบ');
          return;
        }
        const payload = generatePayload(recipient, { amount: transaction.amount });
        const url = await qrcode.toDataURL(payload);
        setQrCodeUrl(url);
        setViewState('QR');
      } catch (error) {
        console.error('Error QR:', error);
      }
    } else if (currentMethod.methodName === PaymentMethodType.CASH) {
        // จ่ายเงินสด -> แสดงคำแนะนำ
        setViewState('CASH');
    } else {
        // โอนบัญชีธนาคาร หรืออื่นๆ -> แสดงรายละเอียด + อัปโหลดสลิป
        setViewState('DETAILS');
    }
  };

  // --- 3. Handle Confirm Payment (Upload Slip) ---
  const handleConfirmPayment = async () => {
    if (!slipFile) {
        alert("กรุณาแนบสลิปการโอนเงิน");
        return;
    }

    setIsSubmitting(true);

    try {
        // Upload File
        const formData = new FormData();
        formData.append("file", slipFile); 

        const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!uploadResponse.ok) throw new Error("อัปโหลดสลิปไม่สำเร็จ");

        const uploadResult = await uploadResponse.json();
        const uploadedUrl = uploadResult.url;
        
        // Update Status
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentId: transaction.paymentId,
                status: 'CONFIRMED',
                slipUrl: uploadedUrl
            })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'เกิดข้อผิดพลาดในการยืนยัน');
        }

        setIsSuccess(true);
        setTimeout(() => router.push('/user/donation'), 3000);

    } catch (error: any) {
        alert(error.message);
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
    setViewState(null);
    setQrCodeUrl(null);
    setSlipFile(null);
    setSlipPreview(null);
  };

  // --- RENDER STATES ---

  // 1. Expired Screen
  if (isExpired) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">รายการหมดอายุ</h2>
                <p className="text-gray-600 mb-6">หมดเวลาในการชำระเงิน กรุณาทำรายการใหม่อีกครั้ง</p>
                <button 
                    onClick={() => router.push('/user/booking')}
                    className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900"
                >
                    กลับสู่หน้าแรก
                </button>
            </div>
        </div>
    );
  }

  // 2. Success Screen
  if (isSuccess) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
              <div className="bg-white p-10 rounded-2xl shadow-xl text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">ชำระเงินสำเร็จ!</h2>
                  <p className="text-gray-600">ขอบคุณสำหรับการบริจาค</p>
                  <p className="text-sm text-gray-400 mt-4">กำลังกลับสู่หน้ารายการ...</p>
              </div>
          </div>
      );
  }

  // 3. Main Payment Screen
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <main className="container mx-auto px-4 max-w-5xl pt-10">
        
        {/* Header with Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-amber-800" />
                <h2 className="text-xl font-bold text-orange-600">ชำระเงินบริจาค</h2>
            </div>
            
            {/* Countdown Timer Display */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">เวลาที่เหลือ:</span>
                <span className="text-xl font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: Payment Methods Selection */}
          <div className="flex-1">
            <h3 className="mb-4 font-semibold text-gray-700">เลือกช่องทางการชำระเงิน</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                const displayInfo = METHOD_DISPLAY_MAP[method.methodName] || { name: method.provider || method.methodName, icon: <Wallet /> };

                return (
                  <button
                    key={method.id}
                    disabled={isSubmitting || !!viewState} 
                    onClick={() => { setSelectedMethodId(method.id); handleReset(); }}
                    className={`relative flex flex-col items-center justify-center p-4 bg-white rounded-xl border transition-all duration-200 shadow-sm h-32
                      ${isSelected ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500 ring-offset-2" : "hover:border-orange-300 hover:shadow-md"}
                      ${(isSubmitting || !!viewState) ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {isSelected && <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>}
                    <div className="mb-3 transform scale-110">{displayInfo.icon}</div>
                    <span className="text-sm font-medium text-gray-800 text-center leading-tight">{displayInfo.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Instruction Box */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-2">เงื่อนไขการชำระเงิน</h4>
                <p className="text-sm text-gray-500">กรุณาชำระเงินภายในเวลาที่กำหนด หากเกินกำหนดรายการจะถูกยกเลิกอัตโนมัติ</p>
            </div>
          </div>

          {/* RIGHT: Action & Summary Panel */}
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 sticky top-6 border border-gray-100">
              
              {/* --- VIEW 1: Summary (Before Proceed) --- */}
              {!viewState ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปยอดบริจาค</h3>
                    <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center mb-6 border border-orange-100">
                        <span className="text-orange-800 font-semibold">ยอดชำระสุทธิ</span>
                        <span className="text-2xl font-bold text-orange-600">{transaction.amount.toLocaleString()} ฿</span>
                    </div>
                    
                    <button 
                        onClick={handleProceed}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {currentMethod?.methodName === PaymentMethodType.PROMPTPAY ? (
                            <><Wallet className="w-5 h-5"/> สร้าง QR Code</>
                        ) : 'ดำเนินการต่อ'}
                    </button>
                </div>
              ) : (
                // --- VIEW 2: Payment Action ---
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    
                    {/* Amount Display */}
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm mb-1">ยอดชำระเงิน</p>
                        <p className="text-3xl font-bold text-orange-600">{transaction.amount.toLocaleString()} ฿</p>
                    </div>

                    {/* ---------- CASE 1: เงินสด (CASH) ---------- */}
                    {viewState === 'CASH' && (
                        <div className="w-full bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6 text-center">
                            <Store className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <h4 className="text-lg font-bold text-blue-800 mb-2">ชำระเงินที่สมาคม</h4>
                            <p className="text-sm text-blue-700 mb-4">
                                กรุณาติดต่อชำระเงินที่จุดรับบริจาคของสมาคม <br/>
                                โดยแจ้งรหัสอ้างอิง: <strong>{transaction.refNo}</strong>
                            </p>
                            <div className="p-3 bg-white rounded border border-blue-200 text-xs text-gray-500">
                                สถานะการจองของท่านจะยังไม่สมบูรณ์<br/>จนกว่าเจ้าหน้าที่จะยืนยันการรับเงิน
                            </div>
                        </div>
                    )}

                    {/* ---------- CASE 2: QR Code (PromptPay) ---------- */}
                    {viewState === 'QR' && qrCodeUrl && (
                        <div className="mb-6 text-center">
                            <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm mb-2 relative group mx-auto inline-block">
                                <img src={qrCodeUrl} alt="Payment QR" className="w-48 h-48 object-contain mix-blend-multiply" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{currentMethod?.provider}</p>
                            <p className="text-xs text-gray-500">PromptPay: {currentMethod?.accountNumber}</p>
                        </div>
                    )}

                    {/* ---------- CASE 3: Bank Details (Transfer) ---------- */}
                    {viewState === 'DETAILS' && (
                        <div className="w-full bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">โอนเงินเข้าบัญชี</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">ธนาคาร</span>
                                    <span className="font-bold text-gray-800 text-right">{currentMethod?.provider}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">เลขที่บัญชี</span>
                                    <span className="font-mono text-lg font-bold text-purple-700 tracking-wide select-all bg-white px-2 py-0.5 rounded border border-gray-200">
                                        {currentMethod?.accountNumber}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">ชื่อบัญชี</span>
                                    <span className="font-medium text-gray-800 text-right text-sm">สมาคมศิษย์เก่า (ตัวอย่าง)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <hr className="w-full border-gray-100 mb-6" />

                    {/* Upload Slip Section (Only for QR or DETAILS) */}
                    {viewState !== 'CASH' ? (
                        <div className="w-full space-y-4">
                             {!slipPreview ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors group"
                                >
                                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                                    <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">แนบสลิปการโอนเงิน</p>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={slipPreview} alt="Slip Preview" className="w-full h-auto max-h-48 object-cover mx-auto" />
                                    <button 
                                        onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                            <div className="flex gap-3 mt-4">
                                <button onClick={handleReset} disabled={isSubmitting} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">
                                    ย้อนกลับ
                                </button>
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={!slipFile || isSubmitting}
                                    className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2
                                        ${!slipFile || isSubmitting ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-orange-600 hover:bg-orange-700'}`
                                    }
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "ยืนยันการชำระเงิน"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Back Button for CASH
                        <button onClick={handleReset} className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                            ย้อนกลับ / เลือกวิธีอื่น
                        </button>
                    )}

                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}