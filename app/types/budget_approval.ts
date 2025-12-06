export interface ProjectProposal {
  id?: number; // ✅ เพิ่ม id
  ppid?: number; // (เก็บไว้กัน error โค้ดเก่า)
  
  projectName: string;
  objective: string;
  description: string;
  requestedAmount: number;
  projectStartDate: string;
  projectEndDate: string;
  responsibilityUnit: string;
  coverFilePath?: string;
  scoreTotal?: number;
  
  status?: string; // ✅ เพิ่ม status (ที่เป็น PENDING, APPROVED ฯลฯ)
  statusId?: number; // (เก็บไว้กัน error โค้ดเก่า)
  
  managerId?: number; // แก้จาก pmid เป็น managerId ให้ตรง DB (หรือมีทั้งคู่)
  pmid?: number;
  
  bgrid?: number;
  staffId?: number;
  createdAt?: string;
}

export interface ProjectManager {
  id?: number;
  pmid?: number;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  phoneNumber: string;
  email: string;
}

export interface ProjectWithManager extends ProjectProposal {
  manager?: ProjectManager;
}

export type ProjectStatus = 'ทั้งหมด' | 'รอดำเนินการ' | 'เปิดรับโหวต' | 'ปิดรับโหวต' | 'อนุมัติแล้ว';