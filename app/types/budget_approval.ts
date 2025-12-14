// app/types/budget_approval.ts

// Enum สถานะตาม Database
export type ProjectStatus = 'PENDING' | 'OPEN' | 'CLOSE' | 'APPROVED';
export type BudgetRoundStatus = 'OPEN' | 'CLOSED' | 'PREPARING';

export interface BudgetRound {
  id: number;
  roundName: string;
  fiscalYear: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  status: BudgetRoundStatus;
  stats?: {
    totalProposals: number;
    totalRequested: number;
    totalDonated: number;
    remaining: number;
  };
}

export interface ProjectVote {
  id: number;          // ใช้ id ตามมาตรฐาน Database
  alumniId: number;
  proposalId: number;
  createdAt: string | Date;
  voteWeight: number;
}

export interface ProjectManager {
  id: number;           // ใช้ id ตามมาตรฐาน Database
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ProjectProposal {
  id: number;           // ใช้ id ตามมาตรฐาน Database
  projectName: string;
  objective?: string;
  description?: string | null;
  requestedAmount?: number;
  projectStartDate?: string | Date;
  projectEndDate?: string | Date;
  responsibilityUnit?: string;
  coverFilePath?: string;
  scoreTotal?: number;
  status: ProjectStatus; // ใช้ Enum String
  createdAt?: string | Date;
  
  // Relations
  manager?: ProjectManager;
  budgetRound?: any;
  staff?: any;
  votes?: ProjectVote[];
}

// Alias สำหรับการใช้งานที่อาจเรียกชื่อต่างกัน
export interface ProjectWithManager extends ProjectProposal {}