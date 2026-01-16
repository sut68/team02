'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CancelButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal';

export default function CreateTopicForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
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
  const router = useRouter();

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
    console.log('submit');

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
            router.push('/login'); // หรือ path login ของระบบ
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

      // Upload image if provided
      let imageUrl: string | null = null;
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('folder', 'uploads/topics');

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

      // Create topic
      const topicResponse = await fetch('/api/forum/topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          topicImage: imageUrl,
          user_id: userId,
          category_id: categoryId,
        }),
      });

      if (!topicResponse.ok) {
        const topicError = await topicResponse.json();
        throw new Error(topicError.error || 'เกิดข้อผิดพลาดในการสร้างกระทู้');
      }

      // Success - show SuccessModal
      setSuccessMessage('สร้างกระทู้สำเร็จ');
      setShowSuccess(true);

    } catch (err: any) {
      console.error('Error submitting topic:', err);
      setModalConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'เกิดข้อผิดพลาดในการสร้างกระทู้ กรุณาลองใหม่อีกครั้ง',
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
      message: 'คุณต้องการยกเลิกการสร้างกระทู้หรือไม่? ข้อมูลที่กรอกจะไม่ถูกบันทึก',
      isDanger: true,
      showCancelButton: true,
      onConfirm: () => {
        closeModal();
        router.push('/user/talk');
      },
    });
  };

  return (
    <div className='min-h-screen bg-white py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header Section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-semibold text-gray-800'>
            ตั้งกระทู้ใหม่
          </h1>
          <p className='text-sm text-gray-500 mt-2'>แบ่งปันความคิดเห็นและพูดคุยกับชุมชน</p>
        </div>

        <div className='bg-white rounded-2xl shadow-lg p-8'>

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
                หัวข้อกระทู้ <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all hover:border-orange-300'
                placeholder='กรอกหัวข้อกระทู้'
              />
            </div>

            {/* เนื้อหากระทู้ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                เนื้อหากระทู้ <span className='text-red-500'>*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all resize-none hover:border-orange-300'
                placeholder='กรอกเนื้อหากระทู้'
              />
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label className='block text-lg font-medium text-gray-700 mb-2'>
                หมวดหมู่ <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all appearance-none bg-white cursor-pointer hover:border-orange-300'
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
                    onClick={() => {
                      setImage(null);
                      setImagePreview('');
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
                  console.log('Button clicked, calling handleSubmit');
                  handleSubmit();
                }}
                disabled={loading}
                className='px-8 py-3 bg-[#F26522] text-white font-medium rounded-lg hover:bg-[#FB793C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'กำลังสร้างกระทู้...' : 'ตั้งกระทู้เลย'}
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
          router.push('/user/talk');
        }}
      />
    </div>
  );
}
