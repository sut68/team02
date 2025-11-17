'use server';

import { revalidatePath } from 'next/cache';
import { ProjectProposal, ProjectManager } from '@/app/types/budget_approval';

// Simulate database storage (in-memory for demo)
let projectsStore: any[] = [];
let managersStore: any[] = [];

export async function createProjectProposal(data: ProjectProposal) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const ppid = Math.floor(Math.random() * 10000);
  
  const newProject = {
    ...data,
    ppid,
    createdAt: new Date().toISOString(),
    statusId: 1,
    scoreTotal: 0
  };
  
  projectsStore.push(newProject);
  
  return { success: true, ppid };
}

export async function createProjectManager(ppid: number, data: ProjectManager) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const pmid = Math.floor(Math.random() * 10000);
  
  const newManager = {
    ...data,
    pmid
  };
  
  managersStore.push(newManager);
  
  const projectIndex = projectsStore.findIndex(p => p.ppid === ppid);
  if (projectIndex !== -1) {
    projectsStore[projectIndex].pmid = pmid;
  }
  
  revalidatePath('/project/new');
  
  return { success: true, pmid };
}

export async function deleteProject(ppid: number) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  projectsStore = projectsStore.filter(p => p.ppid !== ppid);
  
  revalidatePath('/project');
  
  return { success: true };
}