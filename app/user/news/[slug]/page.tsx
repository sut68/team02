// app/user/news/[slug]/page.tsx

import Image from 'next/image';
import Link from 'next/link';

// ---------------- Mock Data สำหรับหน้า Detail ----------------

type MetaItem = {
  label: string;
  value: string;
  type: 'text' | 'link';
  linkText?: string;
};

const mockDetailData = {
  title: 'SUT Global Entrepreneurship Camp 2026',
  date: '31 ตุลาคม 2568',
  imageUrl: '/Content/Event6.jpg',
  content: `
Be brave to try. Be proud to grow. Be part of GEC2026 !
.
Got the spirit to try, learn, and make new international friends?
This camp is for YOU!
.
SUT Global Entrepreneurship Camp 2026
🎟️ FREE for 30 SUT students only!
📅 Jan 31 – Feb 8, 2026
📍 Bangkok & SUT (Nakhon Ratchasima)
💡 Theme: “Sustainable and Resilient Communities: Innovating for a Healthier Planet and People”
.
What you’ll experience
.
Explore – Discover Thailand’s innovation, startup ecosystem, and culture.
Experience – Learn sustainability, teamwork, and problem-solving with friends from 10+ countries.
Entrepreneurship – Spot problems, validate ideas, and create innovative solutions with real value.
Friendships – Build lasting global connections and memories that inspire.
.
📝 Application Schedule (SUT Internal)
Application period: 13 – 24 November 2025 (until 23:59 hrs, GMT+7)
Announcement of shortlisted candidates: 25 November 2025
40 applicants will be shortlisted based on Google Form responses and a one-page CV.
Shortlisted candidates will book an interview slot.
Interviews: 28 November 2025 (conducted in English at SEDA)
Pre-camp Workshop (Design Thinking): 9 or 10 January 2026 (mandatory for selected participants)
.
💰 Deposit: 300 THB (refunded after full participation; non-refundable upon cancellation)

.
GEC2026 Website: https://sites.google.com/view/sut-gec/home
If you require any further clarifications about the programme and application, please email:
📧 global.entrepreneurship.sut@gmail.com
📞 044-22-3225 (P’Mew, SEDA)
SEDA Website: https://seda.sut.ac.th/.../03b6f758-c078-11f0-b923...
.
✨ You don’t need perfect English — just the courage to try! ✨

  `,
  meta: [
    { label: 'ระยะเวลา', value: '31 มกราคม - 8 กุมภาพันธุ์ 2569', type: 'text' as const },
    {
      label: 'ส่งเอกสารสมัครก่อนวันที่ 24 พฤศจิกายน 2565',
      value: 'https://forms.gle/KHHiVL2fZQZ8WTXc7',
      type: 'link' as const,
      linkText: 'คลิกที่นี่',
    },
  ] as MetaItem[],
  footerTags: [
    { text: '#SUTGEC2026', href: '#' },
    { text: '#SUTStudentsGoGlobal', href: '#' },
    { text: '#SUTEntrepreneurship', href: '#' },
    { text: '#SEDA', href: '#' },
    { text: '#SUT', href: '#' },
    { text: '#ExploreExperienceEntrepreneurshipFriendships', href: '#' },
  ],
  author: 'ส่วนกิจกรรมนักศึกษา',
};

// ---------------- ฟังก์ชันแสดง meta data ----------------

const renderMetaItem = (item: MetaItem) => (
  <div key={item.label} className="py-2">
    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
    {item.type === 'link' ? (
      <Link
        href={item.value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#F26522] text-sm hover:underline"
      >
        {item.linkText || item.value}
      </Link>
    ) : (
      <p className="text-sm text-gray-900">{item.value}</p>
    )}
  </div>
);

// ---------------- Main Component ----------------

export  function NewsDetailPage({ params }: { params: { slug: string } }) {
  const data = mockDetailData;
  // ถ้าอยากใช้ slug จริงทีหลัง ค่อยมา map slug → data อีกที

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl text-left">
      {/* บังคับให้ทุกอย่างชิดซ้ายด้วย text-left ที่ Container หลัก */}

      {/* Title + Date */}
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
          {data.title}
        </h1>
        <p className="text-sm text-gray-500">{data.date}</p>
      </header>

      {/* Featured Image (โปสเตอร์) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] md:aspect-[5/3] lg:aspect-[2/1] mb-8 overflow-hidden rounded-lg shadow-xl">
        <Image
          src={data.imageUrl}
          alt={data.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>

      {/* Content + Sidebar (เรียงบน-ล่าง) */}
      <div className="grid grid-cols-1 gap-8">
        {/* Content */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
            รายละเอียดกิจกรรม
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {data.content}
          </p>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="space-y-3">
            {data.meta.map(renderMetaItem)}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">ข้อมูลเพิ่มเติม</p>
            <div className="flex flex-wrap gap-2">
              {data.footerTags.map((tag) => (
                <Link
                  key={tag.text}
                  href={tag.href}
                  className="text-xs font-medium text-[#F26522] bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition"
                >
                  {tag.text}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <hr className="mt-8 border-gray-200" />

      {/* Footer ผู้เขียน (แบบในรูป) */}
      <footer className="mt-6 flex ">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />

          {/* Author name */}
          <span className="text-base font-semibold text-[#F26522]">
            {data.author}
          </span>

          {/* Divider */}
          <span className="text-gray-300">|</span>

          {/* ผู้เขียน */}
          <span className="text-base text-gray-600">
            ผู้เขียน
          </span>
        </div>
      </footer>
    </div>
  );
}
export default NewsDetailPage;