"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/tables/Table";
import { Card, CardHeader, CardContent } from "../../../components/ui/Card";
import { PrimaryButton, CancelButton } from "../../../components/ui/Button";

type VerifyStatus = "PENDING" | "APPROVED" | "REJECTED";

interface SubmissionFile {
  id: number;
  Path: string;
}

interface Submission {
  id: number;
  Name: string;
  Date: string;
  status: VerifyStatus;
  file?: SubmissionFile | null;
  remark?: string | null;
}

export function SubmissionPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // ควบคุมให้ฟอร์มด้านล่างโผล่/ไม่โผล่
  const [showForm, setShowForm] = useState(false);

  // ดึงข้อมูลจากดาต้าเบส ผ่าน GET /api/user/news/submission
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/news/submission");

      if (!res.ok) {
        setSubmissions([]);
        return;
      }

      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (e) {
      console.error(e);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลจาก DB ตอนเปิดหน้า
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // 🏷 ชื่อสถานะที่อยากให้แสดงฝั่ง user
  const statusLabel = (status: VerifyStatus) => {
    switch (status) {
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ไม่อนุมัติ";
      default:
        return "รอดำเนินการ";
    }
  };

  const statusColor = (status: VerifyStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      case "REJECTED":
        return "bg-red-100 text-red-700 border border-red-300";
      default: // PENDING
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setFileName(f?.name || null);
  };

  // ส่งฟอร์ม
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("กรุณากรอกชื่อหัวเรื่อง");
      return;
    }
    if (!file) {
      setError("กรุณาอัปโหลดไฟล์รายละเอียด");
      return;
    }

    setError("");
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);
      const res = await fetch("/api/user/news/submission", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการยื่นเรื่อง");
        return;
      }

      // ดึงข้อมูลใหม่ทั้งก้อนให้ตรงกับ DB
      await fetchSubmissions();

      // reset form
      setTitle("");
      setFile(null);
      setFileName(null);
      setShowForm(false);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setFile(null);
    setFileName(null);
    setError("");
    setShowForm(false);
  };

  // กดปุ่มด้านบนให้ฟอร์มโผล่
  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const el = document.getElementById("submission-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      {/* ==================== ตารางคำยื่นร้องขอ ==================== */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-gray-800">คำยื่นร้องขอ</h2>

          <PrimaryButton
            type="button"
            onClick={handleOpenForm}
            disabled={submitLoading}
          >
            {submitLoading ? "กำลังยื่นเรื่อง..." : "ยื่นเรื่อง"}
          </PrimaryButton>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ลิงก์ PDF */}
          <Link
            href="/02.jpg"
            className="text-sm text-orange-500 underline underline-offset-2"
          >
            รายละเอียดการยื่นคำร้องขอ.pdf
          </Link>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ลำดับ</TableHead>
                <TableHead>วัน/เดือน/ปี</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>ผลการอนุมัติ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="py-4" colSpan={6}>
                    กำลังโหลดข้อมูล...
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell className="py-4 text-gray-500" colSpan={6}>
                    ยังไม่มีคำยื่นเรื่อง
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((item, index) => {
                  const dateStr = new Date(item.Date).toLocaleDateString(
                    "th-TH",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }
                  );

                  const fileName =
                    item.file?.Path?.split("/").pop() ?? null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{dateStr}</TableCell>
                      <TableCell>{item.Name}</TableCell>

                      {/* ไฟล์รายละเอียด */}
                      <TableCell>
                        {fileName ? (
                          <a
                            href={item.file!.Path}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-500 underline text-sm"
                          >
                            เปิดดูรายละเอียด
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* สถานะ = เม็ดสีแบบเดียวกับแอดมิน */}
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs inline-flex items-center justify-center ${statusColor(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </TableCell>

                      {/* หมายเหตุ */}
                      <TableCell className="text-gray-600 text-sm">
                        {item.remark ||
                          (item.status === "REJECTED"
                            ? "ยังไม่ผ่านการอนุมัติจากผู้ดูแลระบบ"
                            : "")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* แถบลูกศรล่าง */}
          <div className="flex justify-end px-4 py-1 text-xs text-gray-400">
            &raquo;
          </div>
        </CardContent>
      </Card>

      {/* ==================== ฟอร์มยื่นเรื่อง ==================== */}
      {showForm && (
        <div
          id="submission-form"
          className="border rounded-lg p-8 shadow-sm bg-white space-y-6"
        >
          <h2 className="text-2xl font-medium text-gray-800">คำยื่นร้องขอ</h2>

          {/* ชื่อหัวเรื่อง */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-500">
              ชื่อหัวเรื่อง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-md text-sm w-full placeholder-gray-400
              focus:outline-none focus:border-orange-400"
              placeholder="กรอกชื่อหัวเรื่อง"
            />
          </div>

          {/* กล่องอัปโหลดไฟล์ */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-500">
              รายละเอียด <span className="text-red-500">*</span>
            </label>

            <div
              className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center
              text-center cursor-pointer hover:border-orange-400"
            >
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-center">
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
                    รองรับไฟล์เอกสาร WORD / PDF / ZIP
                  </p>

                  {fileName && (
                    <p className="text-xs text-gray-600 mt-1">{fileName}</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* error รวม */}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* ปุ่ม */}
          <div className="flex justify-end gap-3 pt-4">
            <CancelButton type="button" onClick={handleCancel}>
              ยกเลิก
            </CancelButton>

            <PrimaryButton
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? "กำลังยื่นเรื่อง..." : "ยื่นเรื่อง"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionPage;