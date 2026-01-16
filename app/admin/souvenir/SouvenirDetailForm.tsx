'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Upload, Trash2, ImageIcon, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import SuccessModal from "@/app/components/ui/SuccessModal"; // นำเข้า SuccessModal

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
  linkedItemName?: string;
}

interface DonationProjectOption {
  id: number;
  name: string;
  souvenirItemId: number | null;
  linkedItemName?: string;
  goalAmount?: number;
  currentAmount?: number;
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
  
  // ✅ States สำหรับ Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [formData, setFormData] = useState<SouvenirFormData | null>(
    isCreating ? {
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
        let linkedType: 'none' | 'event' | 'donation' = 'none';
        if (data.linkedEventId) {
          linkedType = 'event';
        } else if (data.linkedDonationProjectId) {
          linkedType = 'donation';
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
          linkedEventId: data.linkedEventId,
          linkedDonationProjectId: data.linkedDonationProjectId,
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

    if (!file.type.startsWith('image/')) {
      setModalMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      setShowSuccessModal(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalMsg('ขนาดไฟล์ต้องไม่เกิน 5MB');
      setShowSuccessModal(true);
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
        setModalMsg('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
        setShowSuccessModal(true);
      }
    } catch (error) {
      setModalMsg('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      setShowSuccessModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const url = isCreating ? '/api/admin/souvenir/items' : `/api/admin/souvenir/items/${itemId}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
        setModalMsg(isCreating ? 'เพิ่มของที่ระลึกสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
        setShowSuccessModal(true);
      } else {
        const error = await res.json();
        setModalMsg('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถบันทึกข้อมูลได้'));
        setShowSuccessModal(true);
      }
    } catch (error) {
      setModalMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setShowSuccessModal(true);
    }
  };

  const confirmDelete = async () => {
    const idToDelete = formData?.id || itemId;
    setShowConfirmDelete(false);
    
    try {
      const res = await fetch(`/api/admin/souvenir/items/${idToDelete}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setModalMsg('ลบของที่ระลึกสำเร็จ');
        setShowSuccessModal(true);
      } else {
        const error = await res.json();
        setModalMsg('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถลบได้'));
        setShowSuccessModal(true);
      }
    } catch (error) {
      setModalMsg('เกิดข้อผิดพลาดในการลบข้อมูล');
      setShowSuccessModal(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (modalMsg.includes('สำเร็จ')) {
      if (isCreating) {
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
      fetchLinkOptions();
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </section>
    );
  }

  if (!formData) {
    return (
      <section className="bg-white py-4 text-center text-gray-600">
        <div className="max-w-7xl mx-auto px-4">ไม่พบข้อมูล</div>
      </section>
    );
  }

  return (
    <section className="bg-white min-h-screen relative">
      <SuccessModal show={showSuccessModal} message={modalMsg} onClose={handleModalClose} />

      {/* ✅ Custom Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการลบ?</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed px-4">
              คุณต้องการลบของที่ระลึก "{formData?.name}" หรือไม่? <br/>การลบจะทำให้สินค้าหายไปจากระบบ
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)} 
                className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
              >ยกเลิก</button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-7xl p-4 md:p-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {isCreating ? 'เพิ่มของที่ระลึก' : 'ของที่ระลึก'}
        </h1>

        {!isCreating && (
          <div className="flex justify-end gap-2 mb-6">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); fetchItemData(); }} className="border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 px-6 py-3 rounded-lg transition">
                  <X className="w-5 h-5 inline mr-2" />ยกเลิก
                </button>
                <button onClick={(e) => handleSubmit(e as any)} className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-6 py-3 rounded-lg transition">
                  <Save className="w-5 h-5 inline mr-2" />บันทึก
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowConfirmDelete(true)} className="bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 px-6 py-3 rounded-lg transition">
                  <Trash2 className="w-5 h-5 inline mr-2" />ลบ
                </button>
                <button onClick={() => setIsEditing(true)} className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-6 py-3 rounded-lg transition">
                  <Edit2 className="w-5 h-5 inline mr-2" />แก้ไข
                </button>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-10 gap-10">
          <div className="md:col-span-4">
            <div className="w-full mb-4">
              <div className="relative w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
                {uploading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">กำลังอัพโหลด...</p>
                  </div>
                ) : formData.imageUrl ? (
                  <Image src={formData.imageUrl} alt={formData.name || "ของที่ระลึก"} fill className="object-contain p-4" priority />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button type="button" disabled={!isEditing || uploading} onClick={() => fileInputRef.current?.click()} className="w-full mt-4 border-2 border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 px-4 py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center">
                <Upload className="w-5 h-5 inline mr-2" />{uploading ? "กำลังอัพโหลด..." : formData.imageUrl ? "เปลี่ยนรูปภาพ" : "เพิ่มรูปภาพ"}
              </button>
            </div>

            {!isCreating && (
              <div className="mt-6 space-y-3 text-gray-700 text-sm border-t border-gray-200 pt-4">
                <p className="font-medium text-base">รายละเอียดสรุป</p>
                <p><span className="text-gray-500">SKU:</span> {formData.sku}</p>
                <p><span className="text-gray-500">หมวดหมู่:</span> {formData.category}</p>
                <p><span className="text-gray-500">จำนวนคงเหลือ:</span> <span className="text-[#F26522] font-semibold">{currentStock} {formData.unit}</span></p>
                <p><span className="text-gray-500">สถานะ:</span> {formData.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-6">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">ของที่ระลึก</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">SKU <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} disabled={!isEditing || !isCreating} required className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50" />
                  {!isCreating && <p className="text-xs text-gray-400 mt-1">SKU ไม่สามารถแก้ไขได้</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">ชื่อของที่ระลึก <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing} required className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">หมวดหมู่ <span className="text-red-500">*</span></label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={!isEditing} required className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50">
                    <option value="กิจกรรม">กิจกรรม</option>
                    <option value="บริจาค">บริจาค</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">หน่วย <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} disabled={!isEditing} required className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50" />
                </div>
              </div>

              {isCreating && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">จำนวนเริ่มต้น <span className="text-red-500">*</span></label>
                  <input type="number" value={formData.initialStock} onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })} disabled={!isEditing} required min="0" className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none" />
                </div>
              )}

              {!isCreating && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">จำนวนคงเหลือปัจจุบัน</label>
                  <input type="number" value={currentStock} disabled className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm bg-gray-50" />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">สถานะ</label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input type="radio" checked={formData.active} onChange={() => setFormData({ ...formData, active: true })} disabled={!isEditing} className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500" />ใช้งาน
                  </label>
                  <label className="flex items-center text-gray-500 cursor-pointer">
                    <input type="radio" checked={!formData.active} onChange={() => setFormData({ ...formData, active: false })} disabled={!isEditing} className="w-4 h-4 mr-2 border-gray-300 focus:ring-orange-500" />ไม่ใช้งาน
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">รายละเอียด</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={!isEditing} rows={3} maxLength={200} className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/200 ตัวอักษร</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-medium text-gray-800 mb-6">เชื่อมโยงกับ</h2>
                <select value={formData.linkedType} onChange={(e) => setFormData({ ...formData, linkedType: e.target.value as any, linkedEventId: undefined, linkedDonationProjectId: undefined })} disabled={!isEditing || loadingOptions} className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50">
                  <option value="none">ไม่เชื่อมโยง</option>
                  <option value="event">กิจกรรม</option>
                  <option value="donation">โครงการบริจาค</option>
                </select>

                {formData.linkedType === 'event' && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-500 mb-2">เลือกกิจกรรม <span className="text-red-500">*</span></label>
                    <select value={formData.linkedEventId || ''} onChange={(e) => setFormData({ ...formData, linkedEventId: e.target.value ? parseInt(e.target.value) : undefined })} disabled={!isEditing} required={formData.linkedType === 'event'} className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50">
                      <option value="">-- เลือกกิจกรรม --</option>
                      {events.map((event) => {
                        const isOccupied = event.souvenirItemId !== null && event.souvenirItemId !== itemId;
                        return <option key={event.id} value={event.id} disabled={isOccupied} className={isOccupied ? 'text-gray-400' : ''}>{event.name}{isOccupied ? ` (ผูกกับ: ${event.linkedItemName})` : ''}</option>;
                      })}
                    </select>
                  </div>
                )}

                {formData.linkedType === 'donation' && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-500 mb-2">เลือกโครงการบริจาค <span className="text-red-500">*</span></label>
                    <select value={formData.linkedDonationProjectId || ''} onChange={(e) => setFormData({ ...formData, linkedDonationProjectId: e.target.value ? parseInt(e.target.value) : undefined })} disabled={!isEditing} required={formData.linkedType === 'donation'} className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:border-orange-400 focus:outline-none disabled:bg-gray-50">
                      <option value="">-- เลือกโครงการบริจาค --</option>
                      {donationProjects.map((proj) => {
                        const isOccupied = proj.souvenirItemId !== null && proj.souvenirItemId !== itemId;
                        return <option key={proj.id} value={proj.id} disabled={isOccupied} className={isOccupied ? 'text-gray-400' : ''}>{proj.name}{isOccupied ? ` (ผูกกับ: ${proj.linkedItemName})` : ''}</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>

              {isCreating && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => onSuccess?.()} className="border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 px-8 py-3 rounded-lg transition">ยกเลิก</button>
                  <button type="submit" className="bg-[#F26522] text-white text-sm font-medium hover:bg-orange-600 px-8 py-3 rounded-lg transition">
                    <Save className="w-5 h-5 inline mr-2" />เพิ่มของที่ระลึก
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