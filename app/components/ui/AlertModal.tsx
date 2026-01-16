"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  isDanger?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  message,
  onClose,
  title = "แจ้งเตือน",
  isDanger = false,
}) => {
  if (!isOpen) return null;

  const theme = isDanger
    ? {
        bg: "bg-red-100",
        icon: "text-red-600",
        btnBg: "bg-red-600 hover:bg-red-700",
        btnText: "text-white",
      }
    : {
        bg: "bg-orange-100",
        icon: "text-[#F26522]",
        btnBg: "bg-[#F26522] hover:bg-[#d65a1f]",
        btnText: "text-white",
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
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
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium ${theme.btnText} rounded-lg shadow-sm transition-colors flex items-center gap-2 ${theme.btnBg}`}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
