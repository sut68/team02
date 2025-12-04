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
} from '../../../components/tables/Table';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { PrimaryButton,CancelButton } from '../../../components/ui/Button';

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

export  function AdminSubmissionPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🎯 โหลดข้อมูลจาก API ตอนเปิดหน้า
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/news/submissions");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setFileName(f?.name || null);
  };

  const statusLabel = (status: VerifyStatus) => {
    switch (status) {
      case "APPROVED":
        return "ผ่าน";
      case "REJECTED":
        return "ไม่ผ่าน";
      default:
        return "รอตรวจสอบ";
    }
  };

  const statusColor = (status: VerifyStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-orange-500";
      case "REJECTED":
        return "bg-gray-500";
      default:
        return "bg-yellow-400";
    }
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
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);

      const res = await fetch("/api/news/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการยื่นเรื่อง");
        return;
      }

      // ✅ เอา submission ที่เพิ่งสร้างมาแทรกในตารางเลย
      setSubmissions((prev) => [data.submission, ...prev]);

      // reset form
      setTitle("");
      setFile(null);
      setFileName(null);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">

  {/* ==================== ตารางคำยื่นร้องขอ ==================== */}
  <Card className="shadow-sm rounded-xl">
    <CardHeader className="flex items-center justify-between">
      <h2 className="text-2xl font-medium text-gray-800">คำยื่นร้องขอ</h2>

      
    </CardHeader>

    <CardContent className="space-y-4">

      

      

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

                const fileName = item.file?.Path
                  ? item.file.Path.split("/").pop()
                  : null;

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
                          className="text-orange-500 underline text-sm"
                        >
                          {fileName}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* สถานะ */}
                    <TableCell>
                      <span
                        className={`px-3 py-1 text-white rounded-full text-xs inline-block ${statusColor(
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
                          ? "ไม่มีสถานที่จัดงานและไฟล์รูปภาพประกอบ"
                          : "")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* แถบลูกศรล่าง */}
        <div className="flex justify-end  px-4 py-1 text-xs text-gray-400">
          &raquo;
        </div>
      
    </CardContent>
  </Card>

    </div>
  );
}
export default AdminSubmissionPage;