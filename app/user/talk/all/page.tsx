'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// Interfaces
interface Category {
  id: number;
  categoryname: string;
  _count?: {
    topics: number;
  };
}

interface Topic {
  id: number;
  title: string;
  content: string;
  topicImage: string | null;
  category: {
    categoryname: string;
  };
  user: {
    fullName: string;
  };
  createddate: string;
  commentcount: number;
}

export default function AllTopicsPage() {
  const router = useRouter();
  
  // States
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // null = ทั้งหมด
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch Categories on mount
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

  // Fetch Topics when page or selectedCategory changes
  useEffect(() => {
    fetchTopics(page, selectedCategory);
  }, [page, selectedCategory]);

  const fetchTopics = async (pageNumber: number, categoryId: number | null) => {
    setLoading(true);
    try {
      // สร้าง URL parameter
      let url = `/api/forum/topic?page=${pageNumber}&limit=${limit}&status=ACTIVE`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Category Click
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPage(1); // รีเซ็ตกลับไปหน้า 1 ทุกครั้งที่เปลี่ยนหมวดหมู่
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        
        {/* Header */}
        <div className='mb-6 flex items-center gap-4'>
          <button 
            onClick={() => router.back()}
            className='p-2 rounded-full hover:bg-gray-200 transition-colors'
          >
            <ArrowLeft className='w-6 h-6 text-gray-600' />
          </button>
          <h1 className='text-3xl font-bold text-gray-800'>
            กระทู้ทั้งหมด
          </h1>
        </div>

        {/* [เพิ่มส่วนนี้] Category Filter Bar */}
        <div className='mb-8 overflow-x-auto pb-2'>
          <div className='flex gap-2 min-w-max'>
            {/* ปุ่มทั้งหมด */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ทั้งหมด
            </button>

            {/* ปุ่มหมวดหมู่ต่างๆ */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.categoryname}
              </button>
            ))}
          </div>
        </div>

        {/* Topic List */}
        <div className='space-y-4'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent'></div>
              <p className='text-gray-500 mt-2'>กำลังโหลดข้อมูล...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg shadow border border-gray-100'>
              <div className='text-gray-400 mb-2'>
                {/* SVG Icon for empty state */}
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className='text-lg font-medium text-gray-600'>ไม่พบกระทู้ในหมวดหมู่นี้</p>
              <p className='text-gray-500'>ลองเลือกหมวดหมู่อื่นดูนะครับ</p>
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => router.push(`/user/talk/detail/${topic.id}`)}
                className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 flex gap-6 group'
              >
                {/* Image */}
                {topic.topicImage && (
                  <div className='w-32 h-32 flex-shrink-0 overflow-hidden rounded-md'>
                    <img 
                      src={topic.topicImage} 
                      alt={topic.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium'>
                      {topic.category?.categoryname || 'ทั่วไป'}
                    </span>
                    <span className='text-gray-400 text-xs'>
                      {new Date(topic.createddate).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <h3 className='text-xl font-semibold text-gray-800 mb-2 truncate group-hover:text-orange-500 transition-colors'>
                    {topic.title}
                  </h3>
                  <p className='text-gray-500 text-sm line-clamp-2 mb-4'>
                    {topic.content}
                  </p>
                  
                  <div className='flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-auto'>
                     <div className='flex items-center gap-2'>
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                            {topic.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span>{topic.user?.fullName || 'ไม่ระบุตัวตน'}</span>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && topics.length > 0 && (
          <div className='flex justify-center items-center gap-4 mt-8 pb-8'>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className='flex items-center gap-1 px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 text-gray-700'
            >
              <ChevronLeft className='w-4 h-4' /> ก่อนหน้า
            </button>
            
            <span className='text-gray-600 font-medium bg-white px-4 py-2 rounded-lg border'>
              หน้า {page} / {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='flex items-center gap-1 px-4 py-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 text-gray-700'
            >
              ถัดไป <ChevronRight className='w-4 h-4' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}