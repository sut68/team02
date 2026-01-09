'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTopicForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError('กรุณากรอกหัวข้อกระทู้');
        setLoading(false);
        return;
      }

      if (!content.trim()) {
        setError('กรุณากรอกเนื้อหากระทู้');
        setLoading(false);
        return;
      }

      if (!category) {
        setError('กรุณาเลือกหมวดหมู่');
        setLoading(false);
        return;
      }

      // Get user ID from auth
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        setError('กรุณาเข้าสู่ระบบก่อน');
        setLoading(false);
        return;
      }
      const userData = await userResponse.json();
      const userId = userData.id;

      // Category is already the ID from the select
      const categoryId = parseInt(category);

      if (isNaN(categoryId)) {
        setError('หมวดหมู่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
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
        setError(topicError.error || 'เกิดข้อผิดพลาดในการสร้างกระทู้');
        setLoading(false);
        return;
      }

      // Success - navigate to talk page
      router.push('/user/talk');
    } catch (err) {
      console.error('Error submitting topic:', err);
      setError('เกิดข้อผิดพลาดในการสร้างกระทู้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/user/talk');
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          {/* Header */}
          <h1 className='text-3xl font-bold text-center mb-8'>
            ตั้งกระทู้ใหม่
          </h1>

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
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors'>
                {imagePreview ? (
                  <div className='relative'>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='max-h-64 mx-auto rounded-lg'
                    />
                    <button
                      onClick={() => {
                        setImage(null);
                        setImagePreview('');
                      }}
                      className='absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </div>
                ) : (
                  <label className='cursor-pointer block'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageChange}
                      className='hidden'
                    />
                    <div className='flex flex-col items-center justify-center space-y-3'>
                      <div className='w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center'>
                        <Upload className='w-12 h-12 text-gray-400' />
                      </div>
                      <p className='text-gray-500'>คลิกเพื่ออัปโหลดรูปภาพ</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className='flex gap-4 pt-4'>
              <button
                type='button'
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked, calling handleSubmit');
                  handleSubmit();
                }}
                disabled={loading}
                className='flex-1 bg-orange-500 text-white py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'กำลังสร้างกระทู้...' : 'ตั้งกระทู้เลย'}
              </button>
              <button
                type='button'
                onClick={handleCancel}
                disabled={loading}
                className='flex-1 bg-gray-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
