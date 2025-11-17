'use client';
import React, { useState } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/InputTextArea';
import { InputIcon } from '../../../components/ui/InputIcon';

interface FileState {
  attachment: File | null;
  logo: File | null;
  image: File | null;
}

interface PreviewState {
  attachment: string | null;
  logo: string | null;
  image: string | null;
}

export default function JobPostPage() {
  const [files, setFiles] = useState<{
    attachment: File | null;
    logo: File | null;
    image: File | null;
  }>({
    attachment: null,
    logo: null,
    image: null
  });

  const [previews, setPreviews] = useState<{
    attachment: string | null;
    logo: string | null;
    image: string | null;
  }>({
    attachment: null,
    logo: null,
    image: null
  });

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setFiles({...files, [field]: file});
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews({...previews, [field]: reader.result as string});
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews({...previews, [field]: null});
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-medium text-[#1F2937] mb-8">
          ประกาศรับสมัครงาน
        </h2>

        <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8">
          <div className="space-y-6">
            {/* ชื่อหัวข้อของงาน */}
            <div>
              <label className="block text-sm text-[#6B7280] mb-2">
                ชื่อหัวข้อของงาน
              </label>
              <Input radius='full' placeholder="ระบุชื่อหัวข้อของงาน" />
            </div>

            {/* title */}
            <div>
              <label className="block text-sm text-[#6B7280] mb-2">
                title
              </label>
              <Input radius='full' placeholder="ระบุ title" />
            </div>

            {/* ตำแหน่งงาน และ ประเภทของงาน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ตำแหน่งงาน
                </label>
                <Input radius='full' placeholder="ระบุตำแหน่งงาน" />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ประเภทของงาน
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-3 border border-[#D1D5DB] rounded-full text-sm text-[#9CA3AF] focus:border-[#FB923C] focus:outline-none appearance-none bg-[#E5E7EB] cursor-pointer pr-10">
                    <option>Select Type</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ระดับการศึกษา และ รายได้เฉลี่ย */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ระดับการศึกษา
                </label>
                <Input radius='full' placeholder="ระบุระดับการศึกษา" />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  รายได้เฉลี่ย
                </label>
                <Input radius='full' placeholder="ระบุรายได้เฉลี่ย" />
              </div>
            </div>

            {/* ชื่อบริษัท และ จำนวนอัตรา */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ชื่อบริษัท
                </label>
                <Input radius='full' placeholder="ระบุชื่อบริษัท" />
              </div>
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  จำนวนอัตรา
                </label>
                <Input radius='full' placeholder="ระบุจำนวนอัตรา" type="number" />
              </div>
            </div>

            {/* ที่อยู่บริษัท */}
            <div>
              <label className="block text-sm text-[#6B7280] mb-2">
                ที่อยู่บริษัท
              </label>
              <Textarea placeholder="ระบุที่อยู่บริษัท" />
            </div>

            {/* ช่องทางการติดต่อ */}
            <div>
              <label className="block text-sm text-[#6B7280] mb-2">
                ช่องทางการติดต่อ
              </label>
              <Textarea placeholder="ระบุช่องทางการติดต่อ" />
            </div>

            {/* วิธีการเดินทาง */}
            <div>
              <label className="block text-sm text-[#6B7280] mb-2">
                วิธีการเดินทาง
              </label>
              <Textarea placeholder="ระบุวิธีการเดินทาง" />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ไฟล์แนบงาน */}
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ไฟล์แนบงาน
                </label>
                {previews.attachment ? (
                  <div className="relative border-2 border-[#D1D5DB] rounded-md overflow-hidden">
                    <img 
                      src={previews.attachment} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setFiles({...files, attachment: null});
                        setPreviews({...previews, attachment: null});
                      }}
                      className="absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-[#D1D5DB]" />
                      <p className="text-sm text-[#9CA3AF]">อัปโหลดไฟล์</p>
                      <p className="text-xs text-[#9CA3AF]">PNG, JPG, PDF</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => handleFileChange('attachment', e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {files.attachment && (
                  <p className="text-xs text-[#4B5563] mt-2">{files.attachment.name}</p>
                )}
              </div>

              {/* ตราบริษัท */}
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  ตราบริษัท
                </label>
                {previews.logo ? (
                  <div className="relative border-2 border-[#D1D5DB] rounded-md overflow-hidden">
                    <img 
                      src={previews.logo} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setFiles({...files, logo: null});
                        setPreviews({...previews, logo: null});
                      }}
                      className="absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-[#D1D5DB]" />
                      <p className="text-sm text-[#9CA3AF]">อัปโหลดไฟล์</p>
                      <p className="text-xs text-[#9CA3AF]">PNG, JPG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {files.logo && (
                  <p className="text-xs text-[#4B5563] mt-2">{files.logo.name}</p>
                )}
              </div>

              {/* รูปบริษัท */}
              <div>
                <label className="block text-sm text-[#6B7280] mb-2">
                  รูปบริษัท
                </label>
                {previews.image ? (
                  <div className="relative border-2 border-[#D1D5DB] rounded-md overflow-hidden">
                    <img 
                      src={previews.image} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setFiles({...files, image: null});
                        setPreviews({...previews, image: null});
                      }}
                      className="absolute top-2 right-2 bg-[#EF4444] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#DC2626]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-[#D1D5DB] rounded-md p-6 text-center hover:border-[#9CA3AF] transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-[#D1D5DB]" />
                      <p className="text-sm text-[#9CA3AF]">อัปโหลดไฟล์</p>
                      <p className="text-xs text-[#9CA3AF]">PNG, JPG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange('image', e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {files.image && (
                  <p className="text-xs text-[#4B5563] mt-2">{files.image.name}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button className="px-8 py-3 border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-full hover:bg-[#F9FAFB] transition-colors">
                ยกเลิก
              </button>
              <button className="px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-[#FFFFFF] text-sm font-medium rounded-full transition-colors">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}