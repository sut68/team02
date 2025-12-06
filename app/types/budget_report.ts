export type ReportStatus = 'ฉบับร่าง' | 'รอตรวจสอบ' | 'อนุมัติ' | 'ส่งกลับไปแก้ไข';

export interface BudgetReport {
  id: number;
  projectName: string;
  imageSrc?: string;
  status: ReportStatus;
  updatedAt: string; // วันที่อัปเดตล่าสุด
}