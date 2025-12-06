"use client";

import React, { useEffect, useState } from "react";
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

export function AdminSubmissionPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [updateLoadingId, setUpdateLoadingId] = useState<number | null>(null);

  // state สำหรับค่าที่กำลังแก้ (ต่อแถว)
  const [editStatus, setEditStatus] = useState<Record<number, VerifyStatus>>(
    {}
  );
  const [editRemark, setEditRemark] = useState<Record<number, string>>({});

  // helper: แถวนี้กำลังอยู่โหมดแก้ไขไหม
  const isEditing = (id: number) =>
    editStatus[id] !== undefined || editRemark[id] !== undefined;

  // โหลดข้อมูลตอนเปิดหน้า
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/news/submission");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "ไม่สามารถโหลดข้อมูลได้");
          setSubmissions([]);
          return;
        }
        setSubmissions(data.submissions || []);
      } catch (e) {
        console.error(e);
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      } finally {
        setLoading(false);
      }
    };

    load();
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
      default: // PENDING
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleChangeStatus = (id: number, value: VerifyStatus) => {
    setEditStatus((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleChangeRemark = (id: number, value: string) => {
    setEditRemark((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleResetEdit = (id: number) => {
    setEditStatus((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
    setEditRemark((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const handleUpdateSubmission = async (id: number) => {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    const newStatus: VerifyStatus =
      editStatus[id] !== undefined ? editStatus[id] : submission.status;

    const newRemark: string =
      editRemark[id] !== undefined ? editRemark[id] : submission.remark ?? "";

    setError("");
    setUpdateLoadingId(id);

    try {
      const res = await fetch("/api/admin/news/submission", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id, // ส่ง id ไปใน body
          status: newStatus,
          remark: newRemark,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ไม่สามารถบันทึกผลการอนุมัติได้");
        return;
      }

      // อัปเดต state ให้ตรงกับข้อมูลใหม่
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: newStatus, remark: newRemark } : s
        )
      );

      // ✅ ปิดโหมดแก้ไขของแถวนี้ → ปุ่มจะหาย
      handleResetEdit(id);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setUpdateLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-gray-800">
            คำขอยื่นเรื่อง
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ลำดับ</TableHead>
                <TableHead>วัน/เดือน/ปี</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>สถานะ</TableHead>
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

                  const currentStatus: VerifyStatus =
                    editStatus[item.id] ?? item.status;

                  const currentRemark: string =
                    editRemark[item.id] ?? item.remark ?? "";

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
                            เปิดดูรายละเอียด
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* สถานะ = select แบบเม็ดสี */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="relative inline-block">
                            <select
                              className={`pl-4 pr-8 py-1 rounded-full text-sm appearance-none cursor-pointer ${statusColor(
                                currentStatus
                              )}`}
                              value={currentStatus}
                              onChange={(e) =>
                                handleChangeStatus(
                                  item.id,
                                  e.target.value as VerifyStatus
                                )
                              }
                            >
                              <option value="PENDING">
                                {statusLabel("PENDING")}
                              </option>
                              <option value="APPROVED">
                                {statusLabel("APPROVED")}
                              </option>
                              <option value="REJECTED">
                                {statusLabel("REJECTED")}
                              </option>
                            </select>
                            {/* เล็กๆ ทำไอคอนลูกศรขวา */}
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                              ▾
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* หมายเหตุ + ปุ่มบันทึก */}
                      <TableCell className="text-gray-600 text-sm">
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="w-full border rounded-lg px-2 py-1 text-sm min-h-[60px]"
                            placeholder="ระบุสาเหตุ เช่น ขาดไฟล์ประกอบ, เนื้อหาไม่ตรงรูปแบบ ฯลฯ"
                            value={currentRemark}
                            onChange={(e) =>
                              handleChangeRemark(item.id, e.target.value)
                            }
                          />

                          {/* แสดงปุ่มเฉพาะตอนกำลังแก้ไข */}
                          {isEditing(item.id) && (
                            <div className="flex gap-2">
                              <PrimaryButton
                                type="button"
                                onClick={() =>
                                  handleUpdateSubmission(item.id)
                                }
                                disabled={updateLoadingId === item.id}
                              >
                                {updateLoadingId === item.id
                                  ? "กำลังบันทึก..."
                                  : "บันทึก"}
                              </PrimaryButton>

                              <CancelButton
                                type="button"
                                onClick={() => handleResetEdit(item.id)}
                              >
                                ล้างค่า
                              </CancelButton>
                            </div>
                          )}
                        </div>
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
    </div>
  );
}

export default AdminSubmissionPage;
