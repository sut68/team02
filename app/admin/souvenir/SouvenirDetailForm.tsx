'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Upload } from 'lucide-react';
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
      category: 'กิจกรรษ',
      unit: 'ชิ้น',
      initialStock: 0,
      active: true,
      imageUrl: '',
    } : null
  );
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    if (!isCreating && itemId) {
      fetchItemData();
    }
  }, [itemId, isCreating]);

  const fetchItemData = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/souvenir/items/${itemId}`);
      if (res.ok) {
        const data = await res.json();
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
        }),
      });

      if (res.ok) {
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
          });
        } else {
          setIsEditing(false);
          fetchItemData();
        }
        onSuccess?.();
      } else {
        const error = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถบันทึกข้อมูลได้'));
      }
    } catch (error) {
      console.error('Error saving souvenir:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
    <section className="bg-white py-8 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-medium text-gray-700">
            {isCreating ? 'เพิ่มของที่ระลึก' : 'รายละเอียดของที่ระลึก'}
          </h1>
          {!isCreating && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      fetchItemData();
                    }}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition font-semibold"
                  >
                    <X className="w-5 h-5" />
                    ยกเลิก
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                  >
                    <Save className="w-5 h-5" />
                    บันทึก
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  <Edit2 className="w-5 h-5" />
                  แก้ไข
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center border border-gray-200 h-full">
              <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden mb-4 border-2 border-dashed border-gray-300 flex items-center justify-center">
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">กำลังอัพโหลด...</p>
                    </div>
                  </div>
                ) : formData.imageUrl ? (
                  <Image
                    src={formData.imageUrl}
                    alt={formData.name || 'ของที่ระลึก'}
                    fill
                    className="object-contain p-8"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
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
                className="flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition font-semibold mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'กำลังอัพโหลด...' : (formData.imageUrl ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      disabled={!isEditing || !isCreating}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="เช่น ENG-001"
                    />
                    {!isCreating && (
                      <p className="text-xs text-gray-500 mt-1">SKU ไม่สามารถแก้ไขได้</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ชื่อของที่ระลึก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="เช่น เข็มกลัดคณะวิศวกรรมศาสตร์"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      หมวดหมู่ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={!isEditing}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="บริจาค">บริจาค</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      หน่วย <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      disabled={!isEditing}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="เช่น ชิ้น, ตัว, อัน"
                    />
                  </div>

                  {isCreating && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        จำนวนเริ่มต้น <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.initialStock}
                        onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
                        disabled={!isEditing}
                        required
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                  )}

                  {!isCreating && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        จำนวนคงเหลือปัจจุบัน
                      </label>
                      <input
                        type="number"
                        value={currentStock}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      สถานะ
                    </label>
                    <div className="flex items-center gap-3 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.active}
                          onChange={() => setFormData({ ...formData, active: true })}
                          disabled={!isEditing}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">ใช้งาน</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!formData.active}
                          onChange={() => setFormData({ ...formData, active: false })}
                          disabled={!isEditing}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">ไม่ใช้งาน</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    maxLength={200}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="เพิ่มรายละเอียดเกี่ยวกับของที่ระลึก... (สูงสุด 200 ตัวอักษร)"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formData.description.length}/200 ตัวอักษร
                  </p>
                </div>

                {isCreating && (
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      เพิ่มของที่ระลึก
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
