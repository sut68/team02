"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  isDanger = false,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // ✅ กำหนดธีมสีที่นี่ (แก้สีได้ง่ายๆ ตรงนี้เลย)
  const theme = isDanger ? {
    bg: 'bg-red-100',           // พื้นหลังไอคอน (แดง)
    icon: 'text-red-600',       // ไอคอน (แดง)
    btnBg: 'bg-red-600 hover:bg-red-700', // ปุ่มยืนยัน (แดง)
    btnText: 'text-white'
  } : {
    bg: 'bg-orange-100',        // พื้นหลังไอคอน (ส้ม)
    icon: 'text-[#F26522]',     // ไอคอน (ส้ม)
    btnBg: 'bg-[#F26522] hover:bg-[#d65a1f]', // ปุ่มยืนยัน (ส้ม)
    btnText: 'text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            {/* เรียกใช้ธีมสี */}
            <div className={`p-2 rounded-full ${theme.bg} ${theme.icon}`}>
              <AlertTriangle size={20} />
            </div>
            {title}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium ${theme.btnText} rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${theme.btnBg}`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}