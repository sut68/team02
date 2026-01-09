'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Topic {
  id: number;
  title: string;
  content: string;
  topicImage: string | null;
  status: string;
  createddate: string;
  lastactivitydate: string;
  commentcount: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  category: {
    id: number;
    categoryname: string;
  };
  comments: Array<{
    id: number;
    content: string;
    createddate: string;
    status: string;
    reasonForDeletion?: string;
    user: {
      id: number;
      fullName: string;
      email: string;
      role: string;
    };
  }>;
}

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<number | null>(null);
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [deletingComment, setDeletingComment] = useState(false);

  const loadTopic = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/forum/topic/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลกระทู้');
      }

      setTopic(data.topic);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setError(errorMessage);
      console.error('Error loading topic:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
          setCurrentUserRole(userData.role);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  const isAdmin = currentUserRole === 'ADMIN';

  const isTopicOwner =
    currentUserId !== null && topic?.user.id === currentUserId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600)
      return `เมื่อ ${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400)
      return `เมื่อ ${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 604800)
      return `เมื่อ ${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      setCommentError('กรุณากรอกความคิดเห็น');
      return;
    }

    if (!params.id) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/forum/topic/${params.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น');
      }

      // Clear comment input
      setCommentContent('');

      // Reload topic to get updated comments
      await loadTopic();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น';
      setCommentError(errorMessage);
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    setSelectedComment(commentId);
    setDeleteModalOpen(true);
    setDeletionReason('');
  };

  const handleConfirmDelete = async () => {
    if (!selectedComment || !deletionReason || !params.id) return;

    setDeletingComment(true);

    try {
      const response = await fetch(
        `/api/forum/topic/${params.id}/comment?commentId=${selectedComment}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reasonForDeletion: deletionReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบความคิดเห็น');
      }

      // Close modal and reload topic
      setDeleteModalOpen(false);
      setSelectedComment(null);
      setDeletionReason('');
      await loadTopic();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบความคิดเห็น';
      setCommentError(errorMessage);
      console.error('Error deleting comment:', err);
    } finally {
      setDeletingComment(false);
    }
  };

  const deletionReasons = [
    {
      value: 'PROFANITY_INSULTS',
      label: 'คำหยาบ/ดูถูก',
      enLabel: '(Profanity/Insults)',
    },
    {
      value: 'HARASSMENT_THREATS',
      label: 'การคุกคาม/ข่มขู่',
      enLabel: '(Harassment/Threats)',
    },
    {
      value: 'SPAM_ADVERTISEMENT',
      label: 'สแปม/โฆษณา',
      enLabel: '(Spam/Advertisement)',
    },
    {
      value: 'IMPERSONATION',
      label: 'แอบอ้างตัวตน',
      enLabel: '(Impersonation)',
    },
    {
      value: 'ILLEGAL_ACTIVITIES',
      label: 'ส่งเสริมสิ่งผิดกฎหมาย',
      enLabel: '(Illegal Activities)',
    },
    {
      value: 'OTHER_PLATFORM_VIOLATIONS',
      label: 'อื่นๆ/ละเมิดกฎแพลตฟอร์ม',
      enLabel: '(Other Platform Violations)',
    },
  ];

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent'></div>
          <p className='text-gray-500 mt-2'>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <p className='text-xl text-gray-500 mb-4'>
          {error || 'ไม่พบข้อมูลกระทู้'}
        </p>
        <button
          onClick={() => router.push('/user/talk')}
          className='px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors'
        >
          กลับหน้ารายการ
        </button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <button
            onClick={() => router.back()}
            className='flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            <span>กลับ</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <article className='bg-white rounded-lg shadow-lg overflow-hidden'>
          {/* Header Section with Orange Bar */}
          <div className='relative border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-white p-8'>
            <div>
              <div className='w-full'>
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>
                  {topic.title}
                </h1>
                <div className='mb-4'>
                  <span className='px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium'>
                    {topic.category.categoryname}
                  </span>
                </div>
                <div className='flex items-center space-x-4 text-sm text-gray-500'>
                  <span className='flex items-center space-x-1'>
                    <MessageCircle className='w-4 h-4' />
                    <span>{topic.commentcount} ความคิดเห็น</span>
                  </span>
                  <span>{formatDate(topic.createddate)}</span>
                  <span>โดย {topic.user.fullName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          {topic.topicImage && (
            <div className='p-8'>
              <div className='grid grid-cols-1 gap-4'>
                <img
                  src={topic.topicImage}
                  alt={topic.title}
                  className='w-full rounded-lg shadow-md'
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className='p-8 space-y-6'>
            <div className='prose max-w-none'>
              <div
                className='text-gray-700 leading-relaxed whitespace-pre-wrap'
                dangerouslySetInnerHTML={{
                  __html: topic.content.replace(/\n/g, '<br />'),
                }}
              />
            </div>

            {/* Category Tag */}
            <div className='flex flex-wrap gap-2 pt-4 border-t'>
              <span className='px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium'>
                {topic.category.categoryname}
              </span>
            </div>

            {/* Share and Actions */}
            <div className='flex justify-between items-center pt-4 border-t'>
              <button className='flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors'>
                <MessageCircle className='w-5 h-5' />
                <span>แสดงความคิดเห็น</span>
              </button>
              <div className='flex items-center space-x-2'>
                {isTopicOwner && (
                  <button
                    onClick={() => router.push(`/user/talk/edit/${topic.id}`)}
                    className='flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors'
                  >
                    <Edit className='w-5 h-5' />
                    <span>แก้ไข</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className='mt-8 bg-white rounded-lg shadow-lg p-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-6'>
            ความคิดเห็น ({topic.comments.length})
          </h2>

          {/* Comment Input */}
          <div className='mb-6'>
            {commentError && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-3 text-sm'>
                {commentError}
              </div>
            )}
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder='แสดงความคิดเห็น...'
              rows={3}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none'
              disabled={submittingComment}
            />
            <div className='flex justify-end mt-2'>
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || !commentContent.trim()}
                className='px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submittingComment ? 'กำลังโพสต์...' : 'โพสต์'}
              </button>
            </div>
          </div>

          {/* Comments */}
          {topic.comments.length > 0 ? (
            <div className='space-y-4'>
              {topic.comments.map((comment) => {
                // ถ้าสถานะคือ DELETED และไม่ใช่ Admin ให้ return null (ซ่อน)
                if (comment.status === 'DELETED' && !isAdmin) {
                  return null;
                }

                return (
                  <div
                    key={comment.id}
                    className={`flex space-x-3 p-4 rounded-lg relative ${
                      comment.status === 'DELETED'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className='flex-shrink-0'>
                      <div className='w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center'>
                        <span className='text-orange-600 font-semibold'>
                          {getInitials(comment.user.fullName)}
                        </span>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-1'>
                        <span className='font-semibold text-gray-800'>
                          {comment.user.fullName}
                        </span>
                        <span className='text-sm text-gray-500'>
                          {formatDate(comment.createddate)}
                        </span>
                      </div>

                      {/* แสดงข้อความเตือนถ้าถูกลบ (เฉพาะ Admin ที่เห็นเพราะ User ถูกดักด้วย if ข้างบนแล้ว) */}
                      {comment.status === 'DELETED' && (
                        <p className="text-red-500 text-sm font-bold mb-1">
                          [ถูกลบโดย Admin: {comment.reasonForDeletion || 'ไม่ระบุเหตุผล'}]
                        </p>
                      )}

                      <p
                        className={`text-gray-700 whitespace-pre-wrap ${
                          comment.status === 'DELETED'
                            ? 'opacity-50 line-through'
                            : ''
                        }`}
                      >
                        {comment.content}
                      </p>
                    </div>

                    {/* ปุ่มลบ - แสดงเฉพาะ Admin และคอมเมนต์ที่ยังไม่ถูกลบ */}
                    {isAdmin && comment.status !== 'DELETED' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className='absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors'
                        title='ลบความคิดเห็น'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              ยังไม่มีความคิดเห็น
            </div>
          )}
        </div>

        {/* Delete Comment Modal */}
        {deleteModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
              <div className='p-6'>
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-xl font-bold text-gray-800'>
                    ลบความคิดเห็น
                  </h3>
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setSelectedComment(null);
                      setDeletionReason('');
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                {/* Comment Preview */}
                {selectedComment && (
                  <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <div className='w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center'>
                        <span className='text-orange-600 text-xs font-semibold'>
                          {topic?.comments
                            .find((c) => c.id === selectedComment)
                            ?.user.fullName.charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className='font-semibold text-gray-800 text-sm'>
                        {
                          topic?.comments.find((c) => c.id === selectedComment)
                            ?.user.fullName
                        }
                      </span>
                    </div>
                    <p className='text-gray-700 text-sm'>
                      {
                        topic?.comments.find((c) => c.id === selectedComment)
                          ?.content
                      }
                    </p>
                  </div>
                )}

                {/* Deletion Reason */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    Deletion Reason:
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {deletionReasons.map((reason) => (
                      <label
                        key={reason.value}
                        className='flex items-start space-x-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50'
                      >
                        <input
                          type='radio'
                          name='deletionReason'
                          value={reason.value}
                          checked={deletionReason === reason.value}
                          onChange={(e) => setDeletionReason(e.target.value)}
                          className='mt-1'
                        />
                        <div className='flex-1'>
                          <div className='text-sm text-gray-700'>
                            {reason.label}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {reason.enLabel}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={!deletionReason || deletingComment}
                    className='flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {deletingComment ? 'กำลังลบ...' : 'ลบ'}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setSelectedComment(null);
                      setDeletionReason('');
                    }}
                    disabled={deletingComment}
                    className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}