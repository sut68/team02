'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Check, XCircle } from 'lucide-react';

type UserStatus = 'pending' | 'approved' | 'rejected';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  studentCode?: string;
  major?: string;
  gradYear?: string;
  userType: 'student' | 'alumni';
  status: UserStatus;
  createdAt: string;
}

interface EditFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
}

export default function UserManagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    password: '',
    confirmPassword: ''
  });

  // ดึงข้อมูลผู้ใช้จาก API หรือ Database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // TODO: เรียก API จริง
      // const response = await fetch('/api/users');
      // const data = await response.json();
      // setUsers(data);

      // Mock data สำหรับทดสอบ
      const mockUsers: User[] = [
        {
          id: '1',
          fullName: 'ธนวา กวดล',
          email: 'thanwa.eng@sut.ac.th',
          phone: '086-245-7930',
          address: '199 หมู่ 9 ถนนมิตรภาพ',
          subdistrict: 'สุรนารี',
          district: 'เมืองนครราชสีมา',
          province: 'นครราชสีมา',
          postalCode: '30000',
          studentCode: 'B6610456',
          major: 'วิศวกรรมคอมพิวเตอร์',
          userType: 'student',
          status: 'pending',
          createdAt: '2025-11-10'
        },
        {
          id: '2',
          fullName: 'สมชาย ใจดี',
          email: 'somchai@sut.ac.th',
          phone: '081-234-5678',
          address: '123 ถนนสุรนารายณ์',
          subdistrict: 'ในเมือง',
          district: 'เมืองนครราชสีมา',
          province: 'นครราชสีมา',
          postalCode: '30000',
          studentCode: 'B6510123',
          major: 'วิศวกรรมไฟฟ้า',
          gradYear: '2568',
          userType: 'alumni',
          status: 'approved',
          createdAt: '2025-11-08'
        },
        {
          id: '3',
          fullName: 'สมหญิง รักเรียน',
          email: 'somying@sut.ac.th',
          phone: '089-876-5432',
          address: '456 หมู่ 5',
          subdistrict: 'โพธิ์กลาง',
          district: 'เมืองนครราชสีมา',
          province: 'นครราชสีมา',
          postalCode: '30000',
          studentCode: 'B6610789',
          major: 'วิศวกรรมโยธา',
          userType: 'student',
          status: 'rejected',
          createdAt: '2025-11-12'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      subdistrict: user.subdistrict,
      district: user.district,
      province: user.province,
      postalCode: user.postalCode,
      password: '',
      confirmPassword: ''
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      subdistrict: '',
      district: '',
      province: '',
      postalCode: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      alert('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    try {
      // TODO: เรียก API เพื่ออัปเดตข้อมูล
      // const response = await fetch(`/api/users/${selectedUser?.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // if (response.ok) {
      //   await fetchUsers();
      //   handleCloseModal();
      //   alert('อัปเดตข้อมูลสำเร็จ');
      // }

      // Mock update
      setUsers(users.map(user => 
        user.id === selectedUser?.id 
          ? { ...user, ...formData } 
          : user
      ));
      handleCloseModal();
      alert('อัปเดตข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      // TODO: เรียก API เพื่ออัปเดตสถานะ
      // await fetch(`/api/users/${userId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });

      // Mock update
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      alert(`อัปเดตสถานะเป็น ${getStatusText(newStatus)} สำเร็จ`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่?')) return;

    try {
      // TODO: เรียก API เพื่อลบข้อมูล
      // await fetch(`/api/users/${userId}`, { method: 'DELETE' });

      // Mock delete
      setUsers(users.filter(user => user.id !== userId));
      alert('ลบผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'pending': return 'รอตรวจสอบ';
      case 'approved': return 'อนุมัติ';
      case 'rejected': return 'ปฏิเสธ';
      default: return status;
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">จัดการผู้ใช้งาน</h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อ, อีเมล หรือรหัสนักศึกษา"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เบอร์โทร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสนักศึกษา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.studentCode || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.userType === 'student' ? 'ศิษย์ปัจจุบัน' : 'ศิษย์เก่า'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(user.id, 'approved')}
                                className="text-green-600 hover:text-green-900"
                                title="อนุมัติ"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(user.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="ปฏิเสธ"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="ลบ"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-600">
          แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Row 1: ชื่อ-นามสกุล and ที่อยู่ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      ที่อยู่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Row 2: อีเมล, ตำบล, อำเภอ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      ตำบล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subdistrict"
                      value={formData.subdistrict}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      อำเภอ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Row 3: รหัสผ่าน, จังหวัด, รหัสไปรษณีย์ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="ต้องมีอย่างน้อย 8 ตัวอักษร (เว้นว่างถ้าไม่ต้องการเปลี่ยน)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      จังหวัด <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      รหัสไปรษณีย์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{5}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Row 4: ยืนยันรหัสผ่าน, เบอร์โทรศัพท์ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-4 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
