export interface ProjectProposal {
  ppid?: number;
  projectName: string;
  objective: string;
  description: string;
  requestedAmount: number;
  projectStartDate: string;
  projectEndDate: string;
  responsibilityUnit: string;
  coverFilePath?: string;
  scoreTotal?: number;
  statusId?: number;
  pmid?: number;
  bgrid?: number;
  staffId?: number;
  createdAt?: string;
}

export interface ProjectManager {
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