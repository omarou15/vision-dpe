import Dexie, { Table } from 'dexie'

export interface DPEProject {
  id?: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'in_progress' | 'completed'
  data: Record<string, unknown>
  xmlContent?: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface DPESyncQueue {
  id?: number
  projectId: string
  action: 'create' | 'update' | 'delete'
  data: string
  timestamp: Date
  retryCount: number
}

export class SHIELDDatabase extends Dexie {
  projects!: Table<DPEProject>
  syncQueue!: Table<DPESyncQueue>

  constructor() {
    super('SHIELD_DB')
    
    this.version(1).stores({
      projects: '++id, createdAt, updatedAt, status, syncStatus',
      syncQueue: '++id, projectId, timestamp'
    })
  }
}

export const db = new SHIELDDatabase()

// Helper functions
export async function saveProject(project: Omit<DPEProject, 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date()
  const projectData = {
    ...project,
    createdAt: project.id ? undefined : now,
    updatedAt: now
  }
  
  const id = await db.projects.put(projectData as DPEProject)
  
  // Add to sync queue if online
  if (navigator.onLine) {
    await addToSyncQueue(id.toString(), project.id ? 'update' : 'create', projectData)
  }
  
  return id.toString()
}

export async function getProject(id: string): Promise<DPEProject | undefined> {
  return await db.projects.get(id)
}

export async function getAllProjects(): Promise<DPEProject[]> {
  return await db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id)
  await addToSyncQueue(id, 'delete', { id })
}

export async function addToSyncQueue(
  projectId: string, 
  action: 'create' | 'update' | 'delete',
  data: unknown
): Promise<void> {
  await db.syncQueue.add({
    projectId,
    action,
    data: JSON.stringify(data),
    timestamp: new Date(),
    retryCount: 0
  })
}

export async function getPendingSyncItems(): Promise<DPESyncQueue[]> {
  return await db.syncQueue.orderBy('timestamp').toArray()
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  await db.syncQueue.delete(id)
}

export async function incrementRetryCount(id: number): Promise<void> {
  const item = await db.syncQueue.get(id)
  if (item) {
    await db.syncQueue.update(id, { retryCount: item.retryCount + 1 })
  }
}
