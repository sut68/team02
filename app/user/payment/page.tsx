// app/donate/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image'; // 💡 ใช้ Next/Image (ถ้า QR Code อยู่ใน /public)

export default function DonationPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const amountToDonate = 100; // 100 บาท

  const handleGenerateQR = async () => {
    setIsLoading(true);
    setError(null);
    setQrCodeUrl(null); // 💡 ซ่อน QR เก่าก่อน
    
    // 💡 หน่วงเวลาจำลอง (3 วินาที)
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // --- 💡 โค้ดสำหรับเรียก API Omise (ที่ถูกต้อง) ---
      // const response = await fetch('/api/donate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: amountToDonate * 100, // ส่งเป็นสตางค์
      //     currency: 'THB',
      //   }),
      // });
      
      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.error || 'API call failed');
      // }
      // setQrCodeUrl(data.qrImageUrl); // 👈 ใช้ URL จริงจาก Omise
      // ------------------------------------------

      
      // --- 💡 ใช้โค้ดทดสอบของคุณ (แสดงรูปภาพ /qr_test.png) ---
      // (ผมแก้ไข "ublic" เป็น "/public" หรือ "/qr_test.png")
      setQrCodeUrl("/qr_test.png"); // 👈 ใช้รูปภาพทดสอบ
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
    
    setIsLoading(false);
  };

  return (
    // 💡 1. Container หลัก: จัดให้อยู่กลางหน้าจอ และพื้นหลังสีเทา
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* 💡 2. Card UI: การ์ดสีขาวสำหรับเนื้อหา */}
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-xl text-center">
        
      <h1 className="text-2xl font-bold text-red-800 mb-8">
          หน้านี้ยังไม่มีเวลาทำจริงจังนะครับ 
      </h1>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ร่วมบริจาค {amountToDonate} บาท
        </h1>
        
        <p className="text-gray-600 mb-6">
          คลิกปุ่มด้านล่างเพื่อสร้าง QR Code สำหรับสแกนจ่าย
        </p>

        {/* 💡 3. ปุ่มกด: ขยายเต็มความกว้างของการ์ด และมีสถานะ Loading */}
        <button 
          onClick={handleGenerateQR} 
          disabled={isLoading}
          className="w-full bg-[#F26522] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-orange-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            // 💡 4. สถานะ Loading (Spinner)
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'สร้าง QR Code'
          )}
        </button>

        {/* 💡 5. พื้นที่แสดงผล QR Code (จะแสดงเมื่อกดปุ่ม) */}
        {qrCodeUrl && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <p className="font-semibold text-gray-700 mb-2">สแกน QR Code นี้เพื่อบริจาค</p>
            <Image 
              src={qrCodeUrl} // (ถ้าเป็น Omise ให้ใช้แท็ก <img> ธรรมดา)
              alt="PromptPay QR Code" 
              width={250} 
              height={250}
              priority
              className="mx-auto" // 💡 จัดกลาง
            />
          </div>
        )}

        {/* 💡 6. พื้นที่แสดงผล Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
