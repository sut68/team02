'use client';

import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopTopic {
  id: number;
  title: string;
  topicImage: string | null;
  category: {
    id: number;
    categoryname: string;
  };
  commentCount: number;
}

export default function SUTNewsUI() {
  const router = useRouter();
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTopics = async () => {
      try {
        const response = await fetch('/api/forum/topic/top');
        if (response.ok) {
          const data = await response.json();
          setTopTopics(data.topics || []);
        }
      } catch (error) {
        console.error('Error fetching top topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTopics();
  }, []);

  return (
    // แก้ไข 1: bg-linear -> bg-gradient
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50'>
      {/* Hero Image */}
      <div className='relative w-screen h-[700px]'>
        <img
          src='/36.jpg'
          alt='Students studying'
          className='w-full h-full object-cover'
        />
        {/* แก้ไข 2: bg-linear -> bg-gradient */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60'></div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 -mt-16 relative z-10'>
        <div className='bg-white rounded-2xl shadow-2xl p-8 border border-orange-100'>
          {/* Header with "ตั้งกระทู้ใหม่" button */}
          <div className='flex justify-between items-center mb-8 pb-6 border-b-2 border-orange-100'>
            <div className='flex items-center gap-3'>
              <div className='w-1 h-8 bg-orange-500 rounded-full'></div>
              {/* แก้ไข 3: bg-linear -> bg-gradient */}
              <h1 className='text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent'>
                Topic คอมเม้นยอะสุด
              </h1>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => router.push('/user/talk/all')}
                className='px-6 py-3 rounded-full border-2 border-orange-500 bg-white text-orange-500 font-medium hover:bg-orange-50 transition-all duration-200 hover:scale-105 shadow-sm'
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>

          {/* Top Topics Grid */}
          {loading ? (
            <div className='text-center py-16'>
              <div className='inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent'></div>
              <p className='text-gray-500 mt-4 text-lg'>กำลังโหลดข้อมูล...</p>
            </div>
          ) : topTopics.length === 0 ? (
            <div className='text-center py-16 bg-orange-50 rounded-xl'>
              <MessageCircle className='w-16 h-16 mx-auto text-orange-300 mb-4' />
              <p className='text-gray-500 text-lg'>
                ยังไม่มีกระทู้ที่มีความคิดเห็นใน 30 วันที่ผ่านมา
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Left Column - Top 2 Topics */}
              <div className='space-y-6'>
                {/* First topic */}
                {topTopics[0] && (
                  <div
                    onClick={() =>
                      router.push(`/user/talk/detail/${topTopics[0].id}`)
                    }
                    // แก้ไข 4: bg-linear -> bg-gradient
                    className='bg-gradient-to-br from-white to-orange-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-orange-200 hover:border-orange-400 hover:scale-[1.02] group'
                  >
                    {topTopics[0].topicImage && (
                      <div className='w-full h-64 overflow-hidden relative'>
                        <img
                          src={topTopics[0].topicImage}
                          alt={topTopics[0].title}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                        />
                        <div className='absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg'>
                          TOP 
                        </div>
                      </div>
                    )}
                    <div className='p-6'>
                      <div className='flex items-center gap-4'>
                        {/* แก้ไข 5: bg-linear -> bg-gradient */}
                        <div className='bg-gradient-to-br from-orange-500 to-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-lg'>
                          1
                        </div>
                        <div className='flex-1'>
                          <h3 className='text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-2'>
                            {topTopics[0].title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Second topic */}
                {topTopics[1] && (
                  <div
                    onClick={() =>
                      router.push(`/user/talk/detail/${topTopics[1].id}`)
                    }
                    className='bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-orange-100 hover:border-orange-300 hover:scale-[1.02] group'
                  >
                    <div className='p-6'>
                      <div className='flex items-start space-x-4'>
                        {/* แก้ไข 6: bg-linear -> bg-gradient */}
                        <div className='bg-gradient-to-br from-orange-400 to-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-md'>
                          2
                        </div>
                        {topTopics[1].topicImage && (
                          <div className='relative'>
                            <img
                              src={topTopics[1].topicImage}
                              alt={topTopics[1].title}
                              className='w-24 h-24 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md'
                            />
                          </div>
                        )}
                        <div className='flex-1'>
                          <h3 className='text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2'>
                            {topTopics[1].title}
                          </h3>
                          <span className='inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold'>
                            {topTopics[1].category.categoryname}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Topics 3-6 */}
              <div className='space-y-4'>
                {topTopics.slice(2, 6).map((topic, index) => (
                  <div
                    key={topic.id}
                    onClick={() => router.push(`/user/talk/detail/${topic.id}`)}
                    className='bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-orange-50 hover:border-orange-200 hover:scale-[1.02] group'
                  >
                    <div className='flex items-start space-x-4'>
                      {/* แก้ไข 7: bg-linear -> bg-gradient */}
                      <div className='bg-gradient-to-br from-orange-300 to-orange-400 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-md'>
                        {index + 3}
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2'>
                          {topic.title}
                        </h3>
                        <span className='inline-block px-3 py-1 bg-orange-50 text-orange-500 rounded-full text-xs font-semibold'>
                          {topic.category.categoryname}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/user/talk/create')}
        className='fixed bottom-8 right-8 rounded-full z-50 group'
      >
        <div
          className={
            'relative flex items-center gap-2 px-6 py-4 rounded-full overflow-hidden ' +
            // แก้ไข 8: bg-linear -> bg-gradient
            'backdrop-blur-md bg-gradient-to-r from-orange-500 to-orange-600 border-2 border-orange-400 shadow-2xl ' +
            'hover:scale-110 transition-all duration-300 hover:shadow-orange-300/50'
          }
          style={{
            WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            backdropFilter: 'blur(8px) saturate(120%)',
          }}
        >
          <span className='absolute inset-0 pointer-events-none bg-gradient-to-r from-white/20 via-white/10 to-transparent mix-blend-overlay' />
          <Plus className='w-6 h-6 text-white z-10 group-hover:rotate-90 transition-transform duration-300' />
          <span className='text-white font-bold z-10 text-lg'>
            ตั้งกระทู้ใหม่
          </span>
        </div>
      </button>
    </div>
  );
}