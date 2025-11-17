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
  title: 'DSA Mascot Contest',
  date: '31 ตุลาคม 2568',
  imageUrl: '/25.jpg',
  content: `
ขอเชิญชวนนักศึกษา ผู้เรียน และศิษย์เก่า มกส. มาท้าทายไอเดียสุดครีเอทีฟของคนคุณ 
"DSA Mascot Contest" การออกแบบมาสคอต 
ผู้ชนะรับเงินรางวัลมูลค่ารวมกว่า 10,000 บาท พร้อมเกียรติบัตรสุดสดุดี
อ่านรายละเอียดเพิ่มเติมผ่าน QR Code ในภาพ หรือ http://bit.ly/45cFH92
ทั้งเวลาเรียนอยู่, ความคิดสร้างสรรค์ของคุณ 
อาจกลายเป็นตัวแทนของความเป็นส่วนหนึ่งการนักศึกษา มกส. ในอนาคต
  `,
  meta: [
    { label: 'ระยะเวลา', value: 'วันนี้ – 15 ต.ค. 2568', type: 'text' as const },
    {
      label: 'ส่งผลงาน',
      value: 'https://forms.gle/HCHAR9JKPTF4wqG46',
      type: 'link' as const,
      linkText: 'คลิกที่นี่',
    },
  ] as MetaItem[],
  footerTags: [
    { text: '#DSAMascotContest', href: '#' },
    { text: '#SUT', href: '#' },
    { text: '#ส่วนกิจกรรมนักศึกษา', href: '#' },
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