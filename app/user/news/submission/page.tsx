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
import SuccessModal from "../../../components/ui/SuccessModal"; // นำเข้า SuccessModal

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
  const [showSuccessModal, setShowSuccessModal] = useState(false); // ข้อ 4: State สำหรับ Modal

  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setFileName(f?.name || null);
  };

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
    setSubmitLoading(true); // ข้อ 2: เริ่มสถานะ Loading

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

      await fetchSubmissions();
      setShowSuccessModal(true); // ข้อ 4: แสดง Modal เมื่อสำเร็จ

      // reset form
      setTitle("");
      setFile(null);
      setFileName(null);
      setShowForm(false);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitLoading(false); // ข้อ 2: สิ้นสุดสถานะ Loading
    }
  };

  const handleCancel = () => {
    setTitle("");
    setFile(null);
    setFileName(null);
    setError("");
    setShowForm(false);
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const el = document.getElementById("submission-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      {/* ข้อ 4: เรียกใช้ SuccessModal */}
      <SuccessModal
        show={showSuccessModal}
        message="ยื่นเรื่องเรียบร้อยแล้ว!"
        onClose={() => setShowSuccessModal(false)}
      />

      {/* ==================== ตารางคำยื่นร้องขอ ==================== */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">คำยื่นร้องขอ</h2>

          <PrimaryButton
            type="button"
            onClick={handleOpenForm}
            disabled={submitLoading}
          >
            {submitLoading ? "กำลังยื่นเรื่อง..." : "ยื่นเรื่อง"}
          </PrimaryButton>
        </CardHeader>

        <CardContent className="space-y-4">
          <Link
            href="/submission/News_Submission_Guidelines.pdf"
            className="text-sm text-orange-500 underline underline-offset-2 pb-1 block"
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

                  const fileNameLink =
                    item.file?.Path?.split("/").pop() ?? null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{dateStr}</TableCell>
                      <TableCell>{item.Name}</TableCell>

                      <TableCell>
                        {fileNameLink ? (
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

                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs inline-flex items-center justify-center ${statusColor(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </TableCell>

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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">คำยื่นร้องขอ</h2>

          <div className="space-y-2">
            <label className="block text-sm text-gray-500">
              ชื่อหัวเรื่อง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitLoading} // ข้อ 2: ปิด input ขณะโหลด
              className="px-4 py-3 border border-gray-300 rounded-md text-sm w-full placeholder-gray-400
              focus:outline-none focus:border-orange-400 disabled:bg-gray-100"
              placeholder="กรอกชื่อหัวเรื่อง"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-500">
              รายละเอียด <span className="text-red-500">*</span>
            </label>

            <div
              className={`border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center
              text-center cursor-pointer hover:border-orange-400 ${submitLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <label className={`cursor-pointer ${submitLoading ? 'cursor-not-allowed' : ''}`}>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={submitLoading} // ข้อ 2: ปิด input ขณะโหลด
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
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

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-4">
            <CancelButton 
                type="button" 
                onClick={handleCancel}
                disabled={submitLoading} // ข้อ 2: ปิดปุ่มยกเลิกขณะโหลด
            >
              ยกเลิก
            </CancelButton>

            <PrimaryButton
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading} // ข้อ 2: ปิดปุ่มส่งขณะโหลด
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