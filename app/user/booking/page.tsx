// app/user/booking/page.tsx

'use client'; 

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../../components/ui/Card'; 
import { PrimaryButton, CancelButton } from '../../components/ui/Button'; 
import { Input } from '../../components/ui/Input'; 

const FormLabel = ({ children, htmlFor, className }: { children: React.ReactNode, htmlFor: string, className?: string }) => (
    <label htmlFor={htmlFor} className={`block text-sm text-gray-500 mb-1 ${className || ''}`}>
        {children}
    </label>
);
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

const FormSelect = ({ id, value, onChange, options }: any) => (
    <select
        id={id}
        value={value}
        onChange={onChange}
        // ใช้สไตล์ให้คล้าย Input component
        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 
                   focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
    >
        {options.map((opt: string, index: number) => (
            <option key={index} value={opt}>
                {opt}
            </option>
        ))}
    </select>
);

export default function UserBookingPage() {
    const [formData, setFormData] = useState({
        studentYear: 'รุ่นปีการศึกษา',
        seats: '1',
        fullName: '',
        gift: false,
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? target.checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('ยืนยันการลงทะเบียน: ' + JSON.stringify(formData, null, 2));
    };
    const data = mockDetailData;

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6  lg:col-span-1 w-full">
                    <div className="space-y-5">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                        {data.title}
                    </h1>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {data.date}
                    </h1>
                          
                    <Image
                        src={data.imageUrl}
                        alt={data.title}
                        width={300}
                        height={100}
                        sizes=" "
                    />
                    <h3 className="text-m text-gray-600 mb-2">
                        {data.content}
                    </h3>
                         
                    
                    </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* คอลัมน์ขวา: ฟอร์มลงทะเบียน (ใช้ Input Component) */}
                {/* ------------------------------------------------------ */}
                <div>
                    <Card className="shadow-md rounded-xl border border-gray-200 bg-white">
                        <CardHeader className="text-2xl font-bold text-gray-800">
                            ลงทะเบียนเข้าร่วมกิจกรรม
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                
                                {/* รุ่นปีการศึกษา (Select Component) */}
                                <div>
                                    <FormLabel htmlFor="studentYear">รุ่นปีการศึกษา</FormLabel>
                                    <FormSelect 
                                        id="studentYear" 
                                        value={formData.studentYear} 
                                        onChange={handleChange} 
                                        options={['รุ่นปีการศึกษา', 'Generation 1-7', 'Generation 8-14']}
                                    />
                                </div>
                                
                                {/* จำนวนที่นั่ง (Select Component) */}
                                <div>
                                    <FormLabel htmlFor="seats">จำนวนที่นั่ง</FormLabel>
                                    <FormSelect 
                                        id="seats" 
                                        value={formData.seats} 
                                        onChange={handleChange} 
                                        options={['1', '2', '3', '4', 'มากกว่า 4']}
                                    />
                                </div>

                                {/* ชื่อ-สกุล (ใช้ Input Component) */}
                                <div>
                                    <FormLabel htmlFor="fullName">ชื่อ-สกุล</FormLabel>
                                    <Input 
                                        id="fullName" 
                                        placeholder="กรอกชื่อ-สกุล" 
                                        value={formData.fullName} 
                                        onChange={handleChange}
                                        size="md" // ใช้ size="md" เพื่อให้ได้สไตล์ตามต้องการ
                                    />
                                </div>

                                {/* ของที่ระลึก (Checkbox - ใช้ Input Component) */}
                                <div className="flex items-center pt-2">
                                    <Input
                                        id="gift"
                                        type="checkbox"
                                        checked={formData.gift}
                                        onChange={handleChange}
                                        // ปรับสไตล์ checkbox ให้สอดคล้องกับธีม
                                        className="h-5 w-5 rounded focus:ring-orange-400 text-orange-500 border-gray-300"
                                    />
                                    <FormLabel htmlFor="gift" className="ml-2 text-gray-700">
                                        ของที่ระลึก
                                    </FormLabel>
                                </div>

                                {/* ความต้องการพิเศษ/หมายเหตุ (ใช้ textarea และคลาสสไตล์จาก Input) */}
                                <div>
                                    <FormLabel htmlFor="notes">ความต้องการพิเศษ/หมายเหตุ</FormLabel>
                                    <textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={4}
                                        // นำคลาสสไตล์หลักจาก Input มาประยุกต์ใช้กับ textarea
                                        className="w-full border border-gray-300 bg-transparent placeholder-gray-400 transition-all outline-none 
                                                   focus:outline-none focus:border-orange-400 px-4 py-3 text-sm rounded-md resize-y"
                                    />
                                </div>

                                {/* ปุ่ม */}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <CancelButton onClick={() => setFormData({ studentYear: 'รุ่นปีการศึกษา', seats: '1', fullName: '', gift: false, notes: '' })}>
                                        ยกเลิก
                                    </CancelButton>
                                    <PrimaryButton type="submit">
                                        ยืนยัน
                                    </PrimaryButton>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}