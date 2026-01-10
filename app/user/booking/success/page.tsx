"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PrimaryButton } from "../../../components/ui/Button";
import { useSearchParams } from "next/navigation";

interface BookingData {
  userName: string;
  eventName: string;
  bookingNumber: string;
  qrToken: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        // ✅ แก้ไข URL ให้ใช้ bookingId ที่ดึงมาจาก searchParams
        const res = await fetch(`/api/booking?id=${bookingId}`);
        const data = await res.json();
        
        if (data.success) {
          setBookingData(data.booking);
        } else {
          setError(data.error || 'ไม่พบข้อมูลการจอง');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingData();
    } else {
      setError('ไม่พบรหัสการจองใน URL');
      setLoading(false);
    }
  }, [bookingId]);

  const handleDownloadImage = async () => {
    if (ticketRef.current === null) return;
    
    try {
      const svgElements = ticketRef.current?.querySelectorAll('svg');
      if (svgElements && svgElements.length > 0) {
        const svg = svgElements[0] as SVGElement;
        
        // Convert SVG to Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('ไม่สามารถบันทึกรูปได้');
          return;
        }

        // Set canvas size
        const svgRect = svg.getBoundingClientRect();
        canvas.width = svgRect.width * 2;
        canvas.height = svgRect.height * 2;
        
        // Get SVG as data URL
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const svg64 = btoa(unescape(encodeURIComponent(svgString)));
        const image = new Image();
        
        image.onload = () => {
          ctx.scale(2, 2);
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
          ctx.drawImage(image, 0, 0);
          
          // Download as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `qrcode-${bookingData?.qrToken || Date.now()}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        };
        
        image.onerror = () => {
          alert('ไม่สามารถแปลงรูปได้');
        };
        
        image.src = 'data:image/svg+xml;base64,' + svg64;
      } else {
        alert('ไม่พบ QR Code');
      }
    } catch (err) {
      console.error("Error downloading QR code:", err);
      alert('ไม่สามารถบันทึกรูปได้ กรุณาลองอีกครั้ง');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ส่วนที่ถูก Capture เป็นรูปภาพ */}
        <div ref={ticketRef} className="p-8 mb-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-orange-600 mb-3">
              ยืนยันการจองสำเร็จ!
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              กรุณาแสดง QR Code นี้ต่อเจ้าหน้าที่ <br/>
              เพื่อยืนยันตัวตนและรับของที่ระลึก
            </p>
          </div>

          <div className="flex justify-center bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={bookingData?.qrToken || ""}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 font-mono">
              ID: {bookingData?.bookingNumber}
            </p>
          </div>
        </div>

        <PrimaryButton
          onClick={handleDownloadImage}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-full shadow-lg transition-all active:scale-95"
        >
          บันทึก QR Code 
        </PrimaryButton>
      </div>
    </div>
  );
}

// ✅ หุ้มด้วย Suspense เพื่อรองรับ useSearchParams
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}