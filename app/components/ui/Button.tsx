import React from "react";


const base =
  "rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";


export const PrimaryButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      // แก้ไข: เพิ่มช่องว่างหลัง ${base}
      className={`${base} px-8 py-1 bg-[#F26522] text-white hover:bg-[#FB793C] w-28`}
      {...props}
    >
      {children}
    </button>
  );
};

export const CancelButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      // ใน OutlineButton โค้ดเดิมคุณทำถูกต้องแล้ว
      className={`${base} px-8 py-1 bg-[#6D6E70] text-white hover:bg-[#4A4B4C] w-28`}
      {...props}
    >
      {children}
    </button>
  );
};

