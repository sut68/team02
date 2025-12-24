import { ProjectManagementUI } from './project-management-ui'
import { prisma } from '@/app/lib/prisma'; // 💡 ต้อง import prisma ที่นี่เท่านั้น

// --------------------------------------------------------------------------
// 💡 Types
// --------------------------------------------------------------------------
type ProjectStatus = 'OPEN' | 'CLOSED' | 'COMPLETED';
type Project = {
  id: number;
  title: string;
  goalAmount: number;
  currentAmount: number;
  startDate: string; // ISO Date String
  endDate: string;   // ISO Date String
  status: ProjectStatus;
  ownerName: string;
  posterUrl: string | null;
  createdAt: string;
};

// --------------------------------------------------------------------------
// 💡 Server Component Wrapper
// --------------------------------------------------------------------------

async function fetchInitialProjects(): Promise<Project[]> {
    // 💡 Fetching data directly using Prisma on the Server
    try {
        // 💡 1. ดึงข้อมูลจากฐานข้อมูล
        const projects = await prisma.donationProject.findMany({
          orderBy: { createdAt: 'desc' }
        });
        
        if (!Array.isArray(projects) || projects.length === 0) {
            return [];
        }

        // 💡 2. แปลงข้อมูลจาก Prisma (Date Object) ให้เป็น Plain Object (String)
        const data: Project[] = projects.map(p => ({
            id: p.id,
            title: p.title,
            goalAmount: p.goalAmount,
            currentAmount: p.currentAmount,
            startDate: p.startDate ? p.startDate.toISOString() : '',
            endDate: p.endDate ? p.endDate.toISOString() : '',
            status: p.status as ProjectStatus,
            ownerName: p.ownerName,
            posterUrl: p.posterUrl,
            createdAt: p.createdAt ? p.createdAt.toISOString() : '',
        }));

        return data;

    } catch (error) {
        console.error('Prisma Server failed to fetch initial data:', error);
        return [];
    }
}

// 💡 Export Default Server Component
export default async function ProjectsPage() {
    const initialProjects = await fetchInitialProjects();
    
    return <ProjectManagementUI initialProjects={initialProjects} />;
}