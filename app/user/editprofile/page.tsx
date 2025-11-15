'use client';

import React, { useState, useEffect } from 'react';

interface FormData {
  fullName: string;
  email: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function ProfileEditForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // ดึงข้อมูล profile ของผู้ใช้
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // TODO: เรียก API เพื่อดึงข้อมูลผู้ใช้
      // const response = await fetch('/api/user/profile');
      // const data = await response.json();
      // setFormData(data);
      // setOriginalData(data);
      
      // Mock data สำหรับทดสอบ
      setTimeout(() => {
        const userData = {
          fullName: 'ธนวา กวดล',
          email: 'thanwa.eng@sut.ac.th',
          address: '199 หมู่ 9 ถนนมิตรภาพ',
          subdistrict: 'สุรนารี',
          district: 'เมืองนครราชสีมา',
          province: 'นครราชสีมา',
          postalCode: '30000',
          phone: '086-245-7930',
          password: '',
          confirmPassword: ''
        };
        setFormData(userData);
        setOriginalData(userData);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    try {
      // TODO: เรียก API เพื่ออัปเดตข้อมูล
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // if (response.ok) {
      //   alert('อัปเดตข้อมูลสำเร็จ');
      // }

      // Mock update
      alert('อัปเดตข้อมูลสำเร็จ');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setIsEditing(false);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    fetchUserProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen px-8 pt-16 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-medium text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
          <button
            onClick={() => setIsEditing(true)}
            className={`px-6 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition ${isEditing ? 'invisible' : 'visible'}`}
          >
            แก้ไขข้อมูล
          </button>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* แถวที่ 1: ชื่อ-นามสกุล และ ที่อยู่ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="ธนวา กวดล"
                  required
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  ที่อยู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="199 หมู่ 9 ถนนมิตรภาพ ตำบลสุรนารี อำเภอเมือง"
                  required
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* แถวที่ 2: อีเมล และ ตำบล/อำเภอ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="thanwa.eng@sut.ac.th"
                  required
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    ตำบล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subdistrict"
                    value={formData.subdistrict}
                    onChange={handleChange}
                    placeholder="สุรนารี"
                    required
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    อำเภอ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="เมืองนครราชสีมา"
                    required
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* แถวที่ 3: รหัสผ่าน และ จังหวัด/รหัสไปรษณีย์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="ต้องมีอย่างน้อย 8 ตัวอักษร (เช่น Thanwa2025)"
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="นครราชสีมา"
                    required
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    รหัสไปรษณีย์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="30000"
                    pattern="[0-9]{5}"
                    required
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* แถวที่ 4: ยืนยันรหัสผ่าน และ เบอร์โทรศัพท์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="086-245-7930"
                  required
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition"
              >
                บันทึก
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}