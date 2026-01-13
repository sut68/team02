'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trash2, MessageSquare, ArrowRight, AlertCircle, Search, 
  History, Loader2, Ban, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';

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

interface ReasonCount {
  [key: string]: number;
}

type FilterLabel = 'ทั้งหมด' | 'คำหยาบ/ดูถูก' | 'การคุกคาม/ข่มขู่' | 'สแปม/โฆษณา' | 'แอบอ้างตัวตน' | 'ส่งเสริมสิ่งผิดกฎหมาย' | 'ละเมิดกฎแพลตฟอร์ม' | 'ถังขยะ';

const deletionReasons = [
  { key: 'PROFANITY_INSULTS', label: 'คำหยาบ/ดูถูก', icon: Ban },
  { key: 'HARASSMENT_THREATS', label: 'การคุกคาม/ข่มขู่', icon: AlertCircle },
  { key: 'SPAM_ADVERTISEMENT', label: 'สแปม/โฆษณา', icon: Trash2 },
  { key: 'IMPERSONATION', label: 'แอบอ้างตัวตน', icon: RefreshCw },
  { key: 'ILLEGAL_ACTIVITIES', label: 'ส่งเสริมสิ่งผิดกฎหมาย', icon: AlertCircle },
  { key: 'OTHER_PLATFORM_VIOLATIONS', label: 'ละเมิดกฎแพลตฟอร์ม', icon: Ban },
];

export default function AdminTalkPage() {
  const router = useRouter();
  const [deletedComments, setDeletedComments] = useState<DeletedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterLabel>('ทั้งหมด');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonCounts, setReasonCounts] = useState<ReasonCount>({});

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

  const fetchDeletedComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/talk/deleted-comments');
      if (res.ok) {
        const data = await res.json();
        const comments = data.comments || [];
        setDeletedComments(comments);
        
        // คำนวณจำนวนความคิดเห็นแต่ละประเภท
        const counts: ReasonCount = {};
        comments.forEach((comment: DeletedComment) => {
          const label = getReasonLabel(comment.reasonForDeletion);
          counts[label] = (counts[label] || 0) + 1;
        });
        setReasonCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedComments();
  }, [fetchDeletedComments]);

  // Filter logic
  const filteredComments = deletedComments.filter((comment) => {
    // Status filter
    let matchReason = true;
    if (activeFilter !== 'ทั้งหมด') {
      const reasonKey = deletionReasons.find(r => r.label === activeFilter)?.key;
      matchReason = reasonKey ? comment.reasonForDeletion === reasonKey : false;
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      comment.content.toLowerCase().includes(searchLower) ||
      comment.user.fullName.toLowerCase().includes(searchLower) ||
      comment.topic.title.toLowerCase().includes(searchLower);

    return matchReason && matchSearch;
  });

  const getReasonCount = (filterKey: string) => {
    if (filterKey === 'ทั้งหมด') return deletedComments.length;
    return reasonCounts[filterKey] || 0;
  };

  return (
    <main className="min-h-screen bg-white py-4 px-4 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-semibold text-gray-800">
                การจัดการกระดานสนทนา
            </h1>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* All card */}
          <Card
            className={`cursor-pointer border-2 transition ${
              activeFilter === 'ทั้งหมด' ? 'border-orange-300' : 'border-orange-100'
            }`}
            onClick={() => setActiveFilter('ทั้งหมด')}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <MessageSquare className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-gray-700">ทั้งหมด</h3>
              <p className="text-2xl font-medium text-gray-800 mt-2">{getReasonCount('ทั้งหมด')}</p>
            </CardContent>
          </Card>

          {/* Reason filter cards */}
          {deletionReasons.slice(0, 3).map((reason) => {
            const Icon = reason.icon;
            const isActive = activeFilter === reason.label;
            return (
              <Card
                key={reason.key}
                className={`cursor-pointer border-2 transition ${
                  isActive ? 'border-orange-300' : 'border-orange-100'
                }`}
                onClick={() => setActiveFilter(reason.label as FilterLabel)}
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-normal text-gray-700">{reason.label}</h3>
                  <p className="text-2xl font-medium text-gray-800 mt-2">{getReasonCount(reason.label)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           {/* Left Side: Search & Filters */}
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="ค้นหาเนื้อหา ชื่อผู้ใช้ หรือกระทู้..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Refresh Button */}
                <button
                    onClick={() => fetchDeletedComments()}
                    className="h-10 px-4 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-50 text-gray-600 transition-colors text-sm font-medium"
                    title="รีเฟรชข้อมูล"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">รีเฟรช</span>
                </button>
           </div>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
             <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
             กำลังโหลดข้อมูล...
          </div>
        ) : filteredComments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
            <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-100">
              <div className="flex items-center gap-2 text-orange-700">
                <Trash2 className="w-5 h-5" />
                <h2 className="font-semibold text-lg">ประวัติความคิดเห็นที่ถูกลบ</h2>
              </div>
              <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                {filteredComments.length} รายการ
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
                  {filteredComments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-orange-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="bg-orange-50 p-3 rounded-lg text-gray-700 text-sm border border-orange-200 max-w-md line-clamp-2">
                          &quot;{comment.content}&quot;
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
            <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'ไม่พบรายการตามเงื่อนไขการค้นหา' : 'ไม่มีความคิดเห็นที่ถูกลบในระบบ'}
            </p>
            <button 
              onClick={() => { 
                setSearchTerm('');
                setActiveFilter('ทั้งหมด');
              }}
              className="text-orange-500 hover:underline mt-2 text-sm"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>
    </main>
  );
}