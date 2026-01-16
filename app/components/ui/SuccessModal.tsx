'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  show: boolean;         // ตัวคุมว่าให้แสดงหรือไม่
  message?: string;      // ข้อความที่จะแสดง (Default มีให้)
  onClose?: () => void;  // ฟังก์ชันที่จะทำเมื่อปิด (หรือครบเวลา)
  autoClose?: boolean;   // ตั้งให้ปิดเองอัตโนมัติหรือไม่ (Default: true)
  duration?: number;     // ระยะเวลาที่จะโชว์ (ms) (Default: 2000)
}

export default function SuccessModal({ 
  show, 
  message = 'บันทึกข้อมูลสำเร็จ', 
  onClose,
  autoClose = true,
  duration = 2000
}: SuccessModalProps) {
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // ถ้าเปิดโหมด autoClose ให้ตั้งเวลาปิด
      if (autoClose && onClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          // รอ Animation จบเล็กน้อยแล้วค่อยเรียก onClose จริง
          setTimeout(onClose, 300); 
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop (พื้นหลังสีดำจางๆ) */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className={`relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl transform transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        <div className="mb-4 flex justify-center">
          <div className="bg-green-100 rounded-full p-3 ring-8 ring-green-50 animate-pulse">
            <CheckCircle className="w-12 h-12 text-orange-600" strokeWidth={2.5} />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          สำเร็จ!
        </h3>
        
        <p className="text-gray-600">
          {message}
        </p>

        {/* Loading bar เล็กๆ ด้านล่างเพื่อให้รู้ว่ากำลังจะปิด (Optional) */}
        {autoClose && (
            <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-orange-500 rounded-full transition-all ease-linear" 
                    style={{ 
                        width: isVisible ? '100%' : '0%', 
                        transitionDuration: `${duration}ms` 
                    }} 
                />
            </div>
        )}
      </div>
    </div>
  );
}