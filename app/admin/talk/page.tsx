'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';

interface DeletedComment {
  id: number;
  content: string;
  reasonForDeletion: string;
  createddate: string;
  user: {
    fullName: string;
    email: string;
  };
  topic: {
    id: number;
    title: string;
  };
}

export default function AdminTalkPage() {
  const router = useRouter();
  const [deletedComments, setDeletedComments] = useState<DeletedComment[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันแปลงเหตุผลเป็นภาษาไทย
  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      PROFANITY_INSULTS: 'คำหยาบ/ดูถูก',
      HARASSMENT_THREATS: 'การคุกคาม/ข่มขู่',
      SPAM_ADVERTISEMENT: 'สแปม/โฆษณา',
      IMPERSONATION: 'แอบอ้างตัวตน',
      ILLEGAL_ACTIVITIES: 'ส่งเสริมสิ่งผิดกฎหมาย',
      OTHER_PLATFORM_VIOLATIONS: 'ละเมิดกฎแพลตฟอร์ม',
    };
    return reasons[reason] || reason;
  };

  useEffect(() => {
    fetchDeletedComments();
  }, []);

  const fetchDeletedComments = async () => {
    try {
      const res = await fetch('/api/admin/talk/deleted-comments');
      if (res.ok) {
        const data = await res.json();
        setDeletedComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-orange-900">
            การจัดการกระดานสนทนา
          </h1>
        </div>

        {/* ส่วนแสดงรายการที่ถูกลบ */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-100">
            <div className="flex items-center gap-2 text-orange-700">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-semibold text-lg">ประวัติความคิดเห็นที่ถูกลบ</h2>
            </div>
            <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
              {deletedComments.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-orange-900 text-sm border-b border-orange-100">
                  <th className="p-4 font-medium">ข้อความที่ถูกลบ</th>
                  <th className="p-4 font-medium">สาเหตุการลบ</th>
                  <th className="p-4 font-medium">โพสต์โดย</th>
                  <th className="p-4 font-medium">มาจากกระทู้</th>
                  <th className="p-4 font-medium text-right">วันที่โพสต์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-orange-600">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : deletedComments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-orange-600 flex flex-col items-center">
                       <AlertCircle className="w-8 h-8 mb-2 text-orange-300" />
                       ไม่มีความคิดเห็นที่ถูกลบในระบบ
                    </td>
                  </tr>
                ) : (
                  deletedComments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-orange-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="bg-orange-50 p-3 rounded-lg text-gray-700 text-sm border border-orange-200 max-w-md">
                          <p>&quot;{comment.content}&quot;</p>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {getReasonLabel(comment.reasonForDeletion)}
                        </span>
                      </td>
                      <td className="p-4 align-top text-sm">
                        <div className="font-medium text-gray-900">{comment.user.fullName}</div>
                        <div className="text-gray-500 text-xs">{comment.user.email}</div>
                      </td>
                      <td className="p-4 align-top">
                        <a 
                          href={`/user/talk/detail/${comment.topic.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-700 text-sm font-medium flex items-center gap-1 group"
                        >
                          {comment.topic.title}
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </a>
                      </td>
                      <td className="p-4 align-top text-right text-sm text-gray-500">
                        {new Date(comment.createddate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}