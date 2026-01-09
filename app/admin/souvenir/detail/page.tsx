  // ฟังก์ชัน normalize category ไทย/อังกฤษ -> ACTIVITY/DONATION
  const normalizeCategory = (dbCategory: string | null): "ACTIVITY" | "DONATION" => {
    if (dbCategory === "กิจกรรม" || dbCategory === "ACTIVITY") return "ACTIVITY";
    if (dbCategory === "บริจาค" || dbCategory === "DONATION") return "DONATION";
    return "ACTIVITY";
  };
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Type ให้ตรงกับ Form และ API Response
type SouvenirFormData = {
  code: string; // sku
  name: string;
  description: string;
  category: "ACTIVITY" | "DONATION";
  unit: string;
  quantity: number; // currentStock (read-only)
  status: "active" | "inactive";
  imageUrl: string;
  linkedId: number | null;
};

type OptionItem = { id: number; name: string; souvenirItemId?: number | null; disabled: boolean; label: string };

export default function SouvenirDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemId, setItemId] = useState<number | null>(null);


  // Dropdown options
  const [activityOptions, setActivityOptions] = useState<OptionItem[]>([]);
  const [projectOptions, setProjectOptions] = useState<OptionItem[]>([]);

  // Initial State
  const [formData, setFormData] = useState<SouvenirFormData>({
    code: "",
    name: "",
    description: "",
    category: "ACTIVITY",
    unit: "ชิ้น",
    quantity: 0,
    status: "active",
    imageUrl: "/souvenir/placeholder.png",
    linkedId: null,
  });


  // 1. Fetch Data on Mount (item + link options)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        setItemId(id);

        // Fetch item
        const res = await fetch(`/api/admin/souvenir/items/${id}`);
        if (!res.ok) throw new Error("Failed to fetch item");
        const data = await res.json();

        // Fetch link options
        const optionsRes = await fetch('/api/admin/souvenir/link-options');
        const optionsData = optionsRes.ok ? await optionsRes.json() : { events: [], donationProjects: [] };


        // Map options: show all, but disable if occupied by another item
        const mapOption = (item: any) => {
          const isOccupied = item.souvenirItemId !== null && item.souvenirItemId !== id;
          let label = item.name;
          if (isOccupied && item.linkedItemName) {
            label = `${item.name} (ผูกกับ: ${item.linkedItemName})`;
          }
          return {
            id: item.id,
            name: item.name,
            souvenirItemId: item.souvenirItemId,
            disabled: isOccupied,
            label,
          };
        };
        setActivityOptions(optionsData.events.map(mapOption));
        setProjectOptions(optionsData.donationProjects.map(mapOption));

        // Normalize category
        const normalizedCat = normalizeCategory(data.category);
        // Find current linkedId
        let currentLinkedId = null;
        if (normalizedCat === "ACTIVITY" && data.contents?.length > 0) {
          currentLinkedId = data.contents[0].id;
        } else if (normalizedCat === "DONATION" && data.donationProjects?.length > 0) {
          currentLinkedId = data.donationProjects[0].id;
        }

        setFormData({
          code: data.sku || "",
          name: data.name || "",
          description: data.description || "",
          category: normalizedCat,
          unit: data.unit || "ชิ้น",
          quantity: data.currentStock || 0,
          status: data.active ? "active" : "inactive",
          imageUrl: data.imageUrl || "/souvenir/placeholder.png",
          linkedId: currentLinkedId,
        });
      } catch (error) {
        console.error("Error:", error);
        alert("ไม่พบข้อมูลสินค้า");
        router.push("/admin/souvenir");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params, router]);

  // 2. Handle Image Change (Preview)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ในการใช้งานจริง ควร Upload file ไปที่ Server แล้วเอา URL มาใส่
      // อันนี้ทำ Preview แบบ Base64 ให้ดูก่อน
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };


  // 3. Handle Submit (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/souvenir/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          imageUrl: formData.imageUrl,
          unit: formData.unit,
          active: formData.status === "active",
          linkedId: formData.linkedId,
          linkedType: formData.category === "ACTIVITY" ? "event" : "donation_project"
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      router.refresh();
    } catch (error) {
      console.error("Error updating:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-gray-500 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          ย้อนกลับ
        </button>

        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            แก้ไขข้อมูล: {formData.name}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            formData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {formData.status === 'active' ? '• กำลังใช้งาน' : '• ปิดใช้งาน'}
          </span>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Form Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* รหัสของที่ระลึก (Read Only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสของที่ระลึก (SKU)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">*รหัสสินค้าไม่สามารถแก้ไขได้</p>
                </div>

                {/* ชื่อของที่ระลึก */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อของที่ระลึก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* รายละเอียด */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>


                <div className="grid grid-cols-2 gap-4">
                  {/* หมวดหมู่ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">หมวดหมู่</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({
                        ...formData,
                        category: e.target.value as "ACTIVITY" | "DONATION",
                        linkedId: null // clear link when category changes
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    >
                      <option value="ACTIVITY">กิจกรรม (Activity)</option>
                      <option value="DONATION">บริจาค (Donation)</option>
                    </select>
                  </div>
                  {/* หน่วยนับ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">หน่วยนับ</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="เช่น ชิ้น, ใบ, อัน"
                    />
                  </div>
                </div>

                {/* Context-aware linking dropdown */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-3 text-orange-800 font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656m-3.656-3.656a4 4 0 015.656 0m-7.778 7.778a8 8 0 1111.314-11.314 8 8 0 01-11.314 11.314z" /></svg>
                    {formData.category === "ACTIVITY" ? "เชื่อมโยงกับกิจกรรม" : "เชื่อมโยงกับโครงการบริจาค"}
                  </div>
                  {formData.category === "ACTIVITY" ? (
                    <select
                      value={formData.linkedId || ""}
                      onChange={e => setFormData({ ...formData, linkedId: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">-- เลือกกิจกรรม --</option>
                      {activityOptions.map(opt => (
                        <option 
                          key={opt.id} 
                          value={opt.id} 
                          disabled={opt.disabled}
                          className={opt.disabled ? "text-gray-400 bg-gray-100" : ""}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={formData.linkedId || ""}
                      onChange={e => setFormData({ ...formData, linkedId: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    >
                      <option value="">-- เลือกโครงการบริจาค --</option>
                      {projectOptions.map(opt => (
                        <option 
                          key={opt.id} 
                          value={opt.id} 
                          disabled={opt.disabled}
                          className={opt.disabled ? "text-gray-400 bg-gray-100" : ""}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-orange-600 mt-2">*เลือก{formData.category === "ACTIVITY" ? "กิจกรรม" : "โครงการ"}ที่ต้องการแจกของชิ้นนี้เพียงอย่างเดียว</p>
                </div>

                {/* จำนวน (Read Only - ต้องแก้ผ่าน Stock Movement) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จำนวนคงเหลือปัจจุบัน
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.quantity}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed"
                    />
                     <span className="absolute right-4 top-2 text-gray-500 text-sm">{formData.unit}</span>
                  </div>
                  <p className="text-xs text-orange-500 mt-1">*การปรับจำนวนสินค้า ต้องทำผ่านเมนู "จัดการสต็อก"</p>
                </div>

                {/* สถานะ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกการเปลี่ยนแปลง"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CENTER: Product Image */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center border border-gray-100 sticky top-24">
              <div className="relative h-72 md:h-80 w-full bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden mb-6 border-2 border-dashed border-gray-200">
                <Image
                  src={formData.imageUrl}
                  alt={formData.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
              </div>
              
              <label className="cursor-pointer flex items-center gap-2 px-6 py-2.5 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition font-semibold">
                <Upload className="w-5 h-5" />
                <span>เปลี่ยนรูปภาพ</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}