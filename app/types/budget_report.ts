// app/types/budget_report.ts
import { ProjectProposal, User } from './budget_approval';
export type Role = 'STUDENT' | 'ALUMNI' | 'ADMIN'; // ปรับเพิ่มลดตาม enum จริงใน DB

// Enum สถานะการส่งสรุปโครงการ
export type SummarySubmissionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'NEEDS_REVISION';

// Interface สำหรับรูปภาพประกอบในรายงาน
export interface SubmissionImage {
  id: number;
  imagePath: string;
  createdAt: string | Date;
  submissionId: number;
}

// Interface หลักสำหรับการส่งสรุปโครงการ
export interface SummarySubmission {
  id: number;
  totalActualExpense?: number;    // Float?
  summaryFilePath?: string;       // String?
  submissionDate?: string | Date; // DateTime?
  
  status: SummarySubmissionStatus;
  
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;

  // Foreign Keys
  proposalId: number;
  submitterId?: number;

  // Relations
  proposal?: ProjectProposal;
  submitter?: User | null; // สามารถเปลี่ยนเป็น User Interface ถ้ามีไฟล์ Type ของ User
  images?: SubmissionImage[];
  reportTitle?: string;  // ชื่อที่แต่งแล้ว "รายงานสรุปโครงการ..."
}

// Alias: หากในโค้ดเก่ามีการเรียกใช้ชื่อ BudgetReport คุณสามารถใช้ Type นี้แทนได้
export type BudgetReport = SummarySubmission;