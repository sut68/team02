'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { CancelButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal';

export default function EditTopicForm() {
  const router = useRouter();
  const params = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDanger: false,
    showCancelButton: false,
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState<
    Array<{ id: number; categoryname: string }>
  >([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/forum/category');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Load existing topic data
  const loadTopic = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoadingTopic(true);
      setError(null);
      const response = await fetch(`/api/forum/topic/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลกระทู้');
      }

      const topic = data.topic;

      // Check if current user is the owner
      if (currentUserId !== null && topic.user.id !== currentUserId) {
        setError('คุณไม่มีสิทธิ์แก้ไขกระทู้นี้');
        return;
      }

      // Pre-fill form with existing data
      setTitle(topic.title);
      setContent(topic.content);
      setCategory(topic.category.id.toString());
      if (topic.topicImage) {
        setExistingImageUrl(topic.topicImage);
        setImagePreview(topic.topicImage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setError(errorMessage);
      console.error('Error loading topic:', err);
    } finally {
      setLoadingTopic(false);
    }
  }, [params.id, currentUserId]);

  useEffect(() => {
    if (currentUserId !== null) {
      loadTopic();
    }
  }, [loadTopic, currentUserId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (!title.trim()) {
        setModalConfig({
          isOpen: true,
          title: 'ข้อมูลไม่ครบถ้วน',
          message: 'กรุณากรอกหัวข้อกระทู้',
          isDanger: true,
          showCancelButton: false,
          onConfirm: closeModal,
        });
        setLoading(false);
        return;
      }

      if (!content.trim()) {
        setModalConfig({
          isOpen: true,
          title: 'ข้อมูลไม่ครบถ้วน',
          message: 'กรุณากรอกเนื้อหากระทู้',
          isDanger: true,
          showCancelButton: false,
          onConfirm: closeModal,
        });
        setLoading(false);
        return;
      }

      if (!category) {
        setModalConfig({
          isOpen: true,
          title: 'ข้อมูลไม่ครบถ้วน',
          message: 'กรุณาเลือกหมวดหมู่',
          isDanger: true,
          showCancelButton: false,
          onConfirm: closeModal,
        });
        setLoading(false);
        return;
      }

      // Get user ID from auth
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        setModalConfig({
          isOpen: true,
          title: 'เข้าสู่ระบบ',
          message: 'กรุณาเข้าสู่ระบบก่อน',
          isDanger: true,
          showCancelButton: false,
          onConfirm: () => {
            closeModal();
            router.push('/login');
          },
        });
        setLoading(false);
        return;
      }
      const userData = await userResponse.json();
      const userId = userData.id;

      // Category is already the ID from the select
      const categoryId = parseInt(category);



      if (isNaN(categoryId)) {
        setModalConfig({
          isOpen: true,
          title: 'ข้อมูลไม่ถูกต้อง',
          message: 'หมวดหมู่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
          isDanger: true,
          showCancelButton: false,
          onConfirm: closeModal,
        });
        setLoading(false);
        return;
      }

      // Upload new image if provided, otherwise keep existing
      let imageUrl: string | null = existingImageUrl;
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('folder', 'topics');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          setError(uploadError.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
          setLoading(false);
          return;
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      // Update topic
      const topicResponse = await fetch('/api/forum/topic', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(params.id as string),
          title: title.trim(),
          content: content.trim(),
          topicImage: imageUrl,
          category_id: parseInt(category),
          editedByUserId: userId,
        }),
      });

      if (!topicResponse.ok) {
        const contentType = topicResponse.headers.get('content-type');
        let errorMessage = 'เกิดข้อผิดพลาดในการแก้ไขกระทู้';
        if (contentType && contentType.includes('application/json')) {
          const topicError = await topicResponse.json();
          errorMessage = topicError.error || errorMessage;
        } else {
          errorMessage = `เกิดข้อผิดพลาด (${topicResponse.status}): กรุณาลองใหม่อีกครั้ง`;
        }
        throw new Error(errorMessage);
      }

      // Success - show SuccessModal
      setSuccessMessage('แก้ไขกระทู้สำเร็จ');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error updating topic:', err);
      setModalConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'เกิดข้อผิดพลาดในการแก้ไขกระทู้ กรุณาลองใหม่อีกครั้ง',
        isDanger: true,
        showCancelButton: false,
        onConfirm: closeModal,
      });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: 'ยืนยันการยกเลิก',
      message: 'คุณต้องการยกเลิกการแก้ไขหรือไม่? ข้อมูลที่แก้ไขจะไม่ถูกบันทึก',
      isDanger: true,
      showCancelButton: true,
      onConfirm: () => {
        closeModal();
        router.push(`/user/talk/detail/${params.id}`);
      },
    });
  };

  if (loadingTopic) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent'></div>
          <p className='text-gray-500 mt-2'>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          {/* Header */}
          <h1 className='text-3xl font-bold text-center mb-8'>แก้ไขกระทู้</h1>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'>
              {error}
            </div>
          )}

          {/* Form */}
          <div className='space-y-6'>
            {/* หัวข้อกระทู้ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                หัวข้อกระทู้
              </label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all'
                placeholder='กรอกหัวข้อกระทู้'
              />
            </div>

            {/* เนื้อหากระทู้ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                เนื้อหากระทู้
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none'
                placeholder='กรอกเนื้อหากระทู้'
              />
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                หมวดหมู่
              </label>
              <div className='relative'>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer'
                  disabled={categories.length === 0}
                >
                  <option value=''>เลือกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.categoryname}
                    </option>
                  ))}
                </select>
                <div className='absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                  <svg
                    className='w-5 h-5 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* รูปภาพ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                รูปภาพ
              </label>
              {imagePreview ? (
                <div className='relative border-2 border-[#D1D5DB] rounded-md overflow-hidden'>
                  <img
                    src={imagePreview}
                    alt='Preview'
                    className='w-full h-auto max-h-[500px] object-contain'
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setImage(null);
                      setImagePreview('');
                      setExistingImageUrl(null);
                    }}
                    className='absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]'
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className='block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer'>
                  <div className='flex flex-col items-center gap-2'>
                    <Upload className='w-10 h-10 text-[#D1D5DB]' />
                    <p className='text-sm text-[#9CA3AF]'>อัปโหลดไฟล์</p>
                    <p className='text-xs text-[#9CA3AF]'>PNG, JPG</p>
                  </div>
                  <input
                    type='file'
                    className='hidden'
                    accept='image/*'
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Buttons */}
            <div className='flex justify-end gap-4 pt-6'>
              <CancelButton
                type='button'
                onClick={handleCancel}
                disabled={loading}
                className='px-8 py-3'
              >
                ยกเลิก
              </CancelButton>
              <button
                type='button'
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                disabled={loading}
                className='px-8 py-3 bg-[#F26522] text-white font-medium rounded-lg hover:bg-[#FB793C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gray-50">
              <div className={`p-3 rounded-full ${modalConfig.isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F26522]'}`}>
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{modalConfig.message}</p>
            <div className="flex gap-3 justify-center">
              {modalConfig.showCancelButton && (
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  ยกเลิก
                </button>
              )}
              <button
                onClick={modalConfig.onConfirm}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${modalConfig.isDanger
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 hover:shadow-red-500/30'
                  : 'bg-[#F26522] hover:bg-[#d65a1f] shadow-orange-500/20 hover:shadow-orange-500/30'
                  }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        show={showSuccess}
        message={successMessage}
        onClose={() => {
          setShowSuccess(false);
          router.push(`/user/talk/detail/${params.id}`);
        }}
      />
    </div>
  );
}

