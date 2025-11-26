import Link from 'next/link';
import React from 'react';
import { AdminSubmissionPage } from '../news/appove/page';


// นี่คือเนื้อหาหลักของหน้าแรก (Home Page)
export default function HomePage() {
  return (

    <div className="min-h-screen">
      {/* ส่วนsubmission admin */}
      <AdminSubmissionPage />
      
      {/* ส่วนของที่ระลึก (มี anchor สำหรับเลื่อนจากเมนู) */}
      <div id="souvenir" className="scroll-mt-28">
        <AdminSubmissionPage />
      </div>
    </div>
  );
}