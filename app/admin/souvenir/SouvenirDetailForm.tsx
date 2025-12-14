'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface SouvenirFormData {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  initialStock: number;
  active: boolean;
  imageUrl: string;
  linkedType: 'none' | 'event' | 'donation';
  linkedEventId?: number;
  linkedDonationProjectId?: number;
}

interface EventOption {
  id: number;
  name: string;
  startDate: Date;
  souvenirItemId: number | null;
}

interface DonationProjectOption {
  id: number;
  title: string;
  goalAmount: number;
  currentAmount: number;
}

interface SouvenirDetailFormProps {
  itemId?: number;
  isCreating?: boolean;
  onSuccess?: () => void;
}

export function SouvenirDetailForm({ itemId, isCreating, onSuccess }: SouvenirDetailFormProps) {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [loading, setLoading] = useState(!isCreating);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SouvenirFormData | null>(
    isCreating ? {
      id: 0,
      sku: '',
      name: '',
      description: '',
      category: 'ACTIVITY',
      unit: 'ชิ้น',
      initialStock: 0,
      active: true,
      imageUrl: '',
      linkedType: 'none',
    } : null
  );
  const [currentStock, setCurrentStock] = useState(0);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [donationProjects, setDonationProjects] = useState<DonationProjectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isCreating && itemId) {
      fetchItemData();
    }
    fetchLinkOptions();
  }, [itemId, isCreating]);

  const fetchLinkOptions = async () => {
    setLoadingOptions(true);
    try {
      const res = await fetch('/api/admin/souvenir/link-options');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setDonationProjects(data.donationProjects || []);
      }
    } catch (error) {
      console.error('Error fetching link options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchItemData = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/souvenir/items/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        
        // ตรวจสอบว่าของชิ้นนี้ผูกกับ Event ไหนอยู่
        let linkedType: 'none' | 'event' | 'donation' = 'none';
        let linkedEventId: number | undefined;
        let linkedDonationProjectId: number | undefined;
        
        // ดึงข้อมูล Events ที่ผูกกับของชิ้นนี้
        const eventsRes = await fetch('/api/content');
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          const eventList = Array.isArray(events)
            ? events
            : (events.data ?? events.events ?? []);
          const linkedEvent = eventList.find((e: any) => e.souvenirItemId === itemId);
          if (linkedEvent) {
            linkedType = 'event';
            linkedEventId = linkedEvent.id;
          }
        }
        
        // ถ้ายังไม่เจอ ลองเช็ค Donations (ถ้ามี projectId ในอนาคต)
        if (linkedType === 'none') {
          const donationsRes = await fetch('/api/admin/donations');
          if (donationsRes.ok) {
            const donations = await donationsRes.json();
            const linkedDonation = donations.find((d: any) => d.souvenirItemId === itemId);
            if (linkedDonation) {
              linkedType = 'donation';
              // Note: ปัจจุบัน Donation ไม่มี projectId จึงไม่สามารถระบุได้
            }
          }
        }
        
        setFormData({
          id: data.id,
          sku: data.sku,
          name: data.name,
          description: data.description || '',
          category: data.category,
          unit: data.unit,
          initialStock: data.initialStock,
          active: data.active,
          imageUrl: data.imageUrl || '',
          linkedType,
          linkedEventId,
          linkedDonationProjectId,
        });
        setCurrentStock(data.currentStock);
      }
    } catch (error) {
      console.error('Error fetching souvenir:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'souvenir');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => prev ? { ...prev, imageUrl: data.url } : null);
      } else {
        alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const url = isCreating
        ? '/api/admin/souvenir/items'
        : `/api/admin/souvenir/items/${itemId}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          unit: formData.unit,
          initialStock: isCreating ? formData.initialStock : undefined,
          active: formData.active,
          imageUrl: formData.imageUrl,
          linkedType: formData.linkedType,
          linkedEventId: formData.linkedEventId,
          linkedDonationProjectId: formData.linkedDonationProjectId,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(isCreating ? 'เพิ่มของที่ระลึกสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
        if (isCreating) {
          // Reset form for creating mode
          setFormData({
            id: 0,
            sku: '',
            name: '',
            description: '',
            category: 'กิจกรรม',
            unit: 'ชิ้น',
            initialStock: 0,
            active: true,
            imageUrl: '',
            linkedType: 'none',
          });
        } else {
          setIsEditing(false);
          fetchItemData();
        }
        onSuccess?.();
        fetchLinkOptions(); // Refresh options
      } else {
        const error = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถบันทึกข้อมูลได้'));
      }
    } catch (error) {
      console.error('Error saving souvenir:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async () => {
    if (!itemId || isCreating) return;
    
    const confirmed = window.confirm(
      `คุณต้องการลบของที่ระลึก "${formData?.name}" หรือไม่?\n\nการลบจะทำให้สินค้าหายไปจากระบบ (ตั้งค่า active = false)`
    );
    
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/souvenir/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        alert('ลบของที่ระลึกสำเร็จ');
        onSuccess?.();
      } else {
        const error = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถลบได้'));
      }
    } catch (error) {
      console.error('Error deleting souvenir:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!formData) {
    return (
      <section className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-gray-600">
            ไม่พบข้อมูล
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl p-4 md:p-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {isCreating ? 'เพิ่มของที่ระลึก' : 'ของที่ระลึก'}
        </h1>

        {/* ปุ่มลบและแก้ไข */}
        {!isCreating && (
          <div className="flex justify-end gap-2 mb-6">
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    fetchItemData();
                  }}
                  className="border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 px-6 py-3 rounded-lg transition"
                >
                  <X className="w-5 h-5 inline mr-2" />
                  ยกเลิก
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-6 py-3 rounded-lg transition"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  บันทึก
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleDelete}
                  className="bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 px-6 py-3 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5 inline mr-2" />
                  ลบ
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-6 py-3 rounded-lg transition"
                >
                  <Edit2 className="w-5 h-5 inline mr-2" />
                  แก้ไข
                </button>
              </>
            )}
          </div>
        )}

        {/* Grid หลัก 2 คอลัมน์ */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
          
          {/* คอลัมน์ซ้าย: รูปภาพ */}
          <div className="md:col-span-4">
            <div className="w-full">
              {uploading ? (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">กำลังอัพโหลด...</p>
                  </div>
                </div>
              ) : formData.imageUrl ? (
                <Image
                  src={formData.imageUrl}
                  alt={formData.name || 'ของที่ระลึก'}
                  width={700}
                  height={700}
                  className="rounded-lg shadow-lg object-cover w-full"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">ยังไม่มีรูปภาพ</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button 
                type="button"
                disabled={!isEditing || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-4 border-2 border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5 inline mr-2" />
                {uploading ? 'กำลังอัพโหลด...' : (formData.imageUrl ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ')}
              </button>
            </div>

            {/* ข้อมูลสรุป */}
            {!isCreating && (
              <div className="mt-6 space-y-3 text-gray-700 text-sm">
                <p className="font-medium text-base">รายละเอียดสรุป</p>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <p><span className="text-gray-500">SKU:</span> {formData.sku}</p>
                  <p><span className="text-gray-500">หมวดหมู่:</span> {formData.category}</p>
                  <p><span className="text-gray-500">จำนวนคงเหลือ:</span> <span className="text-[#F26522] font-semibold">{currentStock} {formData.unit}</span></p>
                  <p><span className="text-gray-500">สถานะ:</span> {formData.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}</p>
                </div>
              </div>
            )}
          </div>

          {/* คอลัมน์ขวา: ฟอร์ม */}
          <div className="md:col-span-6">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">
              ของที่ระลึก
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={!isEditing || !isCreating}
                    required
                    placeholder="เช่น ENG-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  />
                  {!isCreating && (
                    <p className="text-xs text-gray-400 mt-1">SKU ไม่สามารถแก้ไขได้</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    ชื่อของที่ระลึก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    required
                    placeholder="เช่น เข็มกลัดคณะวิศวกรรมศาสตร์"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={!isEditing}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="กิจกรรม">กิจกรรม</option>
                    <option value="บริจาค">บริจาค</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    หน่วย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    disabled={!isEditing}
                    required
                    placeholder="เช่น ชิ้น, ตัว, อัน"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>

              {isCreating && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    จำนวนเริ่มต้น <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
                    disabled={!isEditing}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              )}

              {!isCreating && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    จำนวนคงเหลือปัจจุบัน
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">
                  สถานะ
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.active}
                      onChange={() => setFormData({ ...formData, active: true })}
                      disabled={!isEditing}
                      className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500"
                    />
                    ใช้งาน
                  </label>
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.active}
                      onChange={() => setFormData({ ...formData, active: false })}
                      disabled={!isEditing}
                      className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500"
                    />
                    ไม่ใช้งาน
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  maxLength={200}
                  placeholder="เพิ่มรายละเอียดเกี่ยวกับของที่ระลึก... (สูงสุด 200 ตัวอักษร)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.description.length}/200 ตัวอักษร
                </p>
              </div>

              {/* ส่วนเชื่อมโยงกับกิจกรรม */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-medium text-gray-800 mb-6">
                  เชื่อมโยงกับ
                </h2>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    ประเภท
                  </label>
                  <select
                    value={formData.linkedType}
                    onChange={(e) => {
                      const value = e.target.value as 'none' | 'event' | 'donation';
                      setFormData({ 
                        ...formData, 
                        linkedType: value,
                        linkedEventId: undefined,
                        linkedDonationProjectId: undefined,
                      });
                    }}
                    disabled={!isEditing || loadingOptions}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="none">ไม่เชื่อมโยง</option>
                    <option value="event">กิจกรรม</option>
                    <option value="donation">โครงการบริจาค</option>
                  </select>
                </div>

                {formData.linkedType === 'event' && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-500 mb-2">
                      เลือกกิจกรรม <span className="text-red-500">*</span>
                    </label>
                    {loadingOptions ? (
                      <div className="text-sm text-gray-500 px-4 py-2">กำลังโหลด...</div>
                    ) : (
                      <select
                        value={formData.linkedEventId || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          linkedEventId: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        disabled={!isEditing}
                        required={formData.linkedType === 'event'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                      >
                        <option value="">-- เลือกกิจกรรม --</option>
                        {events.map((event) => (
                          <option 
                            key={event.id} 
                            value={event.id}
                            disabled={event.souvenirItemId !== null && event.souvenirItemId !== itemId}
                          >
                            {event.name} ({new Date(event.startDate).toLocaleDateString('th-TH')})
                            {event.souvenirItemId !== null && event.souvenirItemId !== itemId && ' - ผูกแล้ว'}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {events.filter(e => e.souvenirItemId === null || e.souvenirItemId === itemId).length} กิจกรรมที่พร้อมใช้งาน
                    </p>
                  </div>
                )}

                {formData.linkedType === 'donation' && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-500 mb-2">
                      เลือกโครงการบริจาค <span className="text-red-500">*</span>
                    </label>
                    {loadingOptions ? (
                      <div className="text-sm text-gray-500 px-4 py-2">กำลังโหลด...</div>
                    ) : (
                      <select
                        value={formData.linkedDonationProjectId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            linkedDonationProjectId: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        disabled={!isEditing}
                        required={formData.linkedType === 'donation'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50"
                      >
                        <option value="">-- เลือกโครงการบริจาค --</option>
                        {donationProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ( {p.currentAmount.toLocaleString()} / {p.goalAmount.toLocaleString()} )
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* ปุ่ม Submit สำหรับโหมดสร้างใหม่ */}
              {isCreating && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => onSuccess?.()}
                    className="border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 px-8 py-3 rounded-lg transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-8 py-3 rounded-lg transition"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    เพิ่มของที่ระลึก
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
