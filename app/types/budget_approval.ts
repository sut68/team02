export interface ProjectProposal {
  id?: number;      // ✅ เพิ่ม id ให้ตรง DB
  ppid?: number;    // (เก็บไว้กัน error โค้ดเก่า)
  
  projectName: string;
  objective: string;
  description: string;
  requestedAmount: number;
  projectStartDate: string;
  projectEndDate: string;
  responsibilityUnit: string;
  coverFilePath?: string;
  scoreTotal?: number;
  
  status?: string;    // ✅ เพิ่ม status เป็น String (PENDING, APPROVED)
  statusId?: number;  // (เก็บไว้กัน error โค้ดเก่า)
  
  managerId?: number;
  pmid?: number;
  
  budgetRoundId?: number;
  staffId?: number;
  createdAt?: string;
}

export interface ProjectManager {
  id?: number;      // ✅ เพิ่ม id
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

export type ProjectStatus = 'PENDING' | 'OPEN' | 'CLOSE' | 'APPROVED';