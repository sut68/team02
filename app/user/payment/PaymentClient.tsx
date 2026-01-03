'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Check, Store, Landmark, UploadCloud, X, Loader2 } from 'lucide-react';
import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import { PaymentMethodRecord, PaymentMethodType } from '@prisma/client';

// Config UI Mapping
const METHOD_DISPLAY_MAP: Record<string, { name: string; icon: React.ReactNode }> = {
  [PaymentMethodType.PROMPTPAY]: { name: "Prompt Pay", icon: <div className="w-10 h-10 bg-blue-900 text-white flex items-center justify-center rounded-md font-bold text-lg">P</div> },
  [PaymentMethodType.CASH]: { name: "เงินสด (Cash)", icon: <Store className="w-10 h-10 text-gray-600" /> },
  [PaymentMethodType.BANKTRANSFER]: { name: "โอนบัญชีธนาคาร", icon: <Landmark className="w-10 h-10 text-purple-600" /> },
};

interface PaymentClientProps {
  transaction: {
    paymentId: number; // ✅ ใช้ paymentId ตามที่ Server ส่งมา
    amount: number;
    projectTitle: string;
    refNo: string;
    status: string;
  };
  paymentMethods: PaymentMethodRecord[];
}

export default function PaymentClient({ transaction, paymentMethods }: PaymentClientProps) {
  const router = useRouter();
  
  // State
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
    paymentMethods.length > 0 ? paymentMethods[0].id : null
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  
  // Loading & Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  // 1. Generate QR
  const handleGenerateQR = async () => {
    if (!currentMethod) return;

    if (currentMethod.methodName === 'PROMPTPAY') {
      try {
        const recipient = currentMethod.accountNumber || '';
        if (!recipient) {
          alert('ไม่พบเบอร์ PromptPay ในระบบ');
          return;
        }
        const payload = generatePayload(recipient, { amount: transaction.amount });
        const url = await qrcode.toDataURL(payload);
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error QR:', error);
      }
    } else {
        // กรณีอื่นๆ อาจจะแค่แสดงรายละเอียดบัญชี
        setQrCodeUrl("SHOW_DETAILS"); 
    }
  };

  // 2. Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const objectUrl = URL.createObjectURL(file);
      setSlipPreview(objectUrl);
    }
  };

  // 3. Confirm Payment (Upload + API Call)
  const handleConfirmPayment = async () => {
    if (!slipFile) {
        alert("กรุณาแนบสลิปการโอนเงิน");
        return;
    }

    setIsSubmitting(true);

    try {
        // --- STEP A: Upload File  ---
        // ในงานจริง: คุณต้องเขียน API Upload รูป แล้วเอา URL กลับมา
        const formData = new FormData();
        formData.append("file", slipFile); // 'file' ต้องตรงกับที่รับใน API

        const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData, // ส่ง FormData ไป Browser จะจัดการ Content-Type ให้เอง
        });

        if (!uploadResponse.ok) {
             throw new Error("อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่");
        }

        const uploadResult = await uploadResponse.json();
        const uploadedUrl = uploadResult.url; // ได้ URL จริงมาแล้ว (เช่น /uploads/slips/170000.jpg)
        
        console.log("Upload Success:", uploadedUrl);
        
        // --- STEP B: Call API Update Status ---
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentId: transaction.paymentId,
                status: 'CONFIRMED', // แจ้ง backend ว่ายืนยันแล้ว
                slipUrl: uploadedUrl
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'เกิดข้อผิดพลาดในการยืนยัน');
        }

        // --- STEP C: Success ---
        setIsSuccess(true);
        setTimeout(() => {
            // Redirect ไปหน้า Thank You หรือ History
            router.push('/user/donation'); 
        }, 3000);

    } catch (error: any) {
        alert(error.message);
        setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQrCodeUrl(null);
    setSlipFile(null);
    setSlipPreview(null);
  };

  // --- Render Success Screen ---
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-10">
      <main className="container mx-auto px-4 max-w-5xl pt-10">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Wallet className="w-6 h-6 text-amber-800" />
          <h2 className="text-xl font-bold text-orange-600">ชำระเงินบริจาค</h2>
          <span className="text-sm text-gray-400 ml-auto bg-gray-100 px-3 py-1 rounded-full">Ref: {transaction.refNo}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Payment Methods */}
          <div className="flex-1">
            <h3 className="mb-4 font-semibold text-gray-700">เลือกช่องทางการชำระเงิน</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                const displayInfo = METHOD_DISPLAY_MAP[method.methodName] || { name: method.provider || method.methodName, icon: <Wallet /> };

                return (
                  <button
                    key={method.id}
                    disabled={isSubmitting || !!qrCodeUrl} // ห้ามเปลี่ยนถ้ากำลัง process
                    onClick={() => { setSelectedMethodId(method.id); handleReset(); }}
                    className={`relative flex flex-col items-center justify-center p-4 bg-white rounded-xl border transition-all duration-200 shadow-sm h-32
                      ${isSelected ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500 ring-offset-2" : "hover:border-orange-300 hover:shadow-md"}
                      ${(isSubmitting || !!qrCodeUrl) ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {isSelected && <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>}
                    <div className="mb-3 transform scale-110">{displayInfo.icon}</div>
                    <span className="text-sm font-medium text-gray-800 text-center leading-tight">{displayInfo.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Instruction Text */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-2">ขั้นตอนการชำระเงิน</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                    <li>เลือกช่องทางการชำระเงินด้านบน</li>
                    <li>ตรวจสอบยอดเงินและกดปุ่ม "สร้าง QR Code"</li>
                    <li>สแกน QR Code หรือโอนเงินตามเลขบัญชีที่ปรากฏ</li>
                    <li>แนบหลักฐานการโอนเงิน (สลิป)</li>
                    <li>กดปุ่ม "ยืนยันการชำระเงิน"</li>
                </ol>
            </div>
          </div>

          {/* Right: Summary & Action */}
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 sticky top-6 border border-gray-100">
              
              {/* --- VIEW 1: Summary (Before Generate) --- */}
              {!qrCodeUrl ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปยอดบริจาค</h3>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-gray-500 w-2/3">{transaction.projectTitle}</span>
                            <span className="font-medium">{transaction.amount.toLocaleString()} ฿</span>
                        </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center mb-6 border border-orange-100">
                        <span className="text-orange-800 font-semibold">ยอดชำระสุทธิ</span>
                        <span className="text-2xl font-bold text-orange-600">{transaction.amount.toLocaleString()} ฿</span>
                    </div>
                    
                    <button 
                        onClick={handleGenerateQR}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {currentMethod?.methodName === 'PROMPTPAY' ? (
                            <><Wallet className="w-5 h-5"/> สร้าง QR Code ชำระเงิน</>
                        ) : 'ดำเนินการต่อ'}
                    </button>
                </div>
              ) : (
                // --- VIEW 2: Payment Action (QR & Upload) ---
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    
                    {/* Header: Amount */}
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm mb-1">ยอดชำระเงิน</p>
                        <p className="text-3xl font-bold text-orange-600">{transaction.amount.toLocaleString()} ฿</p>
                    </div>

                    {/* QR Code Section */}
                    {qrCodeUrl !== "SHOW_DETAILS" ? (
                        <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm mb-4 relative group">
                            <img src={qrCodeUrl} alt="Payment QR" className="w-48 h-48 object-contain mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 rounded-xl transition-opacity pointer-events-none">
                                <span className="text-xs bg-white px-2 py-1 rounded shadow">บันทึกรูปภาพ</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-center">
                            <p className="font-bold text-gray-700">{currentMethod?.provider}</p>
                            <p className="text-lg font-mono text-gray-900 my-2 select-all">{currentMethod?.accountNumber}</p>
                            <p className="text-xs text-gray-500">กรุณาโอนเงินตามยอดที่ระบุ</p>
                        </div>
                    )}

                    <p className="text-xs text-center text-gray-400 mb-6">
                        บัญชี: {currentMethod?.provider} ({currentMethod?.accountNumber})
                    </p>

                    <hr className="w-full border-gray-100 mb-6" />

                    {/* Upload Slip Section */}
                    <div className="w-full space-y-4">
                        {!slipPreview ? (
                            // ปุ่มกด Upload
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors group"
                            >
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                                <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">แนบสลิปการโอนเงิน</p>
                                <p className="text-xs text-gray-400">รองรับไฟล์ JPG, PNG</p>
                            </div>
                        ) : (
                            // Preview Image
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={slipPreview} alt="Slip Preview" className="w-full h-auto max-h-64 object-cover" />
                                <button 
                                    onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-2 text-center">
                                    หลักฐานการโอนเงิน
                                </div>
                            </div>
                        )}

                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />

                        {/* Confirm Button */}
                        <div className="flex gap-3 mt-4">
                             <button 
                                onClick={handleReset} 
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium text-sm transition-colors"
                            >
                                ย้อนกลับ
                            </button>

                            <button 
                                onClick={handleConfirmPayment}
                                disabled={!slipFile || isSubmitting}
                                className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2
                                    ${!slipFile || isSubmitting 
                                        ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                                        : 'bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all'}`
                                }
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบ...</>
                                ) : (
                                    "ยืนยันการชำระเงิน"
                                )}
                            </button>
                        </div>
                    </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}