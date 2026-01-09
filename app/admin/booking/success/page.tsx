"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardHeader, CardContent } from "../../../components/ui/Card";
import { PrimaryButton } from "../../../components/ui/Button";

function isInAppBrowser() {
      const ua = navigator.userAgent || "";
      return /Line|FBAN|FBAV|Instagram/i.test(ua);
    } 

export default function AdminScanPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  /* =========================
     Fetch booking by QR token
  ========================== */
const fetchBookingDetails = useCallback((text: string) => {
  let token = text;

  if (text.includes("?")) {
    const url = new URL(text);
    token =
      url.searchParams.get("token") ||
      url.searchParams.get("qrToken") ||
      "";
  }

  if (!token) {
    alert("ไม่พบ token ใน QR");
    return;
  }

  setLoading(true);
  fetch(`/api/booking?token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setScanResult(data.booking);
      } else {
        setError(data.error || "ไม่พบข้อมูล");
      }
    })
    .catch(() => setError("เกิดข้อผิดพลาดในการเชื่อมต่อ"))
    .finally(() => setLoading(false));
}, []);

  /* =========================
     Confirm actions
  ========================== */
  const handleConfirm = async (action: "CHECKIN" | "SOUVENIR") => {
    if (!scanResult?.qrToken) return;

    try {
      const res = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: scanResult.qrToken,
          action,
        }),
      });

      if (!res.ok) throw new Error();

      // ✅ Update state immediately (no refetch)
      setScanResult((prev: any) => ({
        ...prev,
        isCheckedIn: action === "CHECKIN" ? true : prev.isCheckedIn,
        souvenirs:
          action === "SOUVENIR"
            ? prev.souvenirs.map((s: any) => ({
                ...s,
                claimed: true,
              }))
            : prev.souvenirs,
      }));
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  /* =========================
      QR Scanner (ฉบับปรับปรุง)
  ========================== */
  useEffect(() => {
  if (isInAppBrowser()) {
    alert("❌ ระบบสแกน QR ไม่รองรับ LINE / IG\nกรุณาเปิดผ่าน Chrome หรือ Safari");
    return;
  }

  const node = document.getElementById("reader");
  if (!node || scannerRef.current) return;

  const scanner = new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0],
    },
    false
  );

  scanner.render(
    (text) => {
      if (!text) return;

      // 🔥 ปิดกล้องทันทีหลังแสกน
      scanner.clear().then(() => {
        scannerRef.current = null;
        fetchBookingDetails(text);
      });
    },
    () => {}
  );

  scannerRef.current = scanner;

  // 🔥 cleanup สำคัญมาก
  return () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
  };
}, [fetchBookingDetails]); // ✅ ต้องมี dependency


  /* =========================
     Derived states
  ========================== */
  const isCheckedIn = scanResult?.isCheckedIn === true;
  const isSouvenirDone = scanResult?.souvenirs?.every(
    (s: any) => s.claimed
  );

  const actionButtonClass = (disabled: boolean) =>
    `w-full py-4 transition ${
      disabled
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-orange-500 hover:bg-orange-600 text-white"
    }`;

  /* =========================
     Render
  ========================== */
  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center py-4 text-orange-600">
        ระบบเจ้าหน้าที่ เช็คอินหน้างาน
      </h1>

      {/* Scanner */}
      {!scanResult && !loading && (
        <Card className="overflow-hidden shadow-sm rounded-xl">
          <CardContent className="p-0">
            <div id="reader" />
          </CardContent>
        </Card>
      )}

      {loading && (
        <p className="text-center text-gray-400 animate-pulse">
          กำลังประมวลผล...
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Result */}
      {scanResult && (
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b ">
            <p className="text-xs text-gray-400 font-medium">
              ข้อมูลผู้เข้าร่วม
            </p>
            <h2 className="text-lg font-bold text-gray-800">
              {scanResult.userName}
            </h2>
            <p className="text-sm text-gray-500">
              {scanResult.eventName}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Check-in */}
                <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                    สถานะการเข้างาน
                </p>

                <div className="flex justify-between items-center text-sm border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-gray-700">Check-in หน้างาน</span>
                    <span
                    className={`font-medium ${
                        isCheckedIn ? "text-gray-400" : "text-green-600"
                    }`}
                    >
                    {isCheckedIn ? "เช็คอินแล้ว" : "ยังไม่เช็คอิน"}
                    </span>
                </div>

                <PrimaryButton
                    onClick={() => handleConfirm("CHECKIN")}
                    disabled={isCheckedIn}
                    className={actionButtonClass(isCheckedIn)}
                >
                    {isCheckedIn ? "เช็คอินเรียบร้อยแล้ว" : "ยืนยันเช็คอิน"}
                </PrimaryButton>
                </div>


            {/* Souvenir */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-gray-600">
                ของที่ระลึก
              </p>

              {scanResult.souvenirs?.map((s: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <span className="text-gray-700">{s.itemName}</span>
                  <span
                    className={`font-medium ${
                      s.claimed
                        ? "text-gray-400"
                        : "text-orange-500"
                    }`}
                  >
                    {s.claimed ? "รับแล้ว" : "ยังไม่ได้รับ"}
                  </span>
                </div>
              ))}

              <PrimaryButton
                onClick={() => handleConfirm("SOUVENIR")}
                disabled={isSouvenirDone}
                className={actionButtonClass(isSouvenirDone)}
              >
                {isSouvenirDone
                  ? "รับของเรียบร้อยแล้ว"
                  : "ยืนยันการรับของ"}
              </PrimaryButton>
            </div>

            {/* Next scan */}
            <button
              onClick={() => {
                setScanResult(null);
                window.location.reload();
              }}
              className="w-full text-center text-sm text-gray-400 hover:text-orange-500 pt-4 underline underline-offset-4"
            >
              แสกนคนถัดไป
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
