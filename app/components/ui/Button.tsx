import React from "react";


const base =
  "rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";


export function PrimaryButton  ({
  children,
  className, // <--- รับ className เข้ามา
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      // ✅ แก้ไข: นำ className ที่รับมาจากภายนอกมาต่อท้าย
      className={`${base} px-8 py-1 bg-[#F26522] text-white hover:bg-[#FB793C] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export function CancelButton  ({
  children,
  className, // <--- รับ className เข้ามา
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>)  {
  return (
    <button
      // ✅ แก้ไข: นำ className ที่รับมาจากภายนอกมาต่อท้าย
      className={`${base} px-8 py-1 bg-[#6D6E70] text-white hover:bg-[#4A4B4C] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};