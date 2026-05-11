import { MOCK_DATA } from './mockData'
import type { DataStore, Task, QuranSession, QuranSessionRequest, Workspace, HouseholdProfile } from '../types'

// In-memory data store (session lifetime; resets on redeploy)
let dataStore: DataStore | null = null

export function initializeDataStore(): DataStore {
  if (dataStore === null) {
    // Deep copy of MOCK_DATA
    dataStore = JSON.parse(JSON.stringify(MOCK_DATA))
  }
  return dataStore as DataStore
}

export function getDataStore(): DataStore {
  if (dataStore === null) {
    return initializeDataStore()
  }
  return dataStore
}

export function getTasks(): Task[] {
  const store = getDataStore()
  return store.tasks
}

export function updateTask(taskId: string, completed: boolean): void {
  const store = getDataStore()
  const task = store.tasks.find(t => t.id === taskId)
  if (task) {
    task.completed = completed
  }
}

export function getChildren() {
  const store = getDataStore()
  return store.children
}

export function getAlerts() {
  const store = getDataStore()
  return store.alerts
}

export function getQuranSessions(): QuranSession[] {
  const store = getDataStore()
  return store.quranSessions
}

export function addQuranSession(sessionData: QuranSessionRequest): QuranSession {
  const store = getDataStore()
  const sessions = store.quranSessions
  const newId = `quran_${String(sessions.length + 1).padStart(3, '0')}`

  const newSession: QuranSession = {
    id: newId,
    childId: sessionData.childId,
    type: sessionData.type,
    surah: sessionData.surah,
    fromAyah: sessionData.fromAyah,
    toAyah: sessionData.toAyah,
    notes: sessionData.notes || '',
    date: new Date().toISOString().split('T')[0],
    lastLogged: 'Today',
  }

  sessions.push(newSession)
  return newSession
}

export function getRecords() {
  const store = getDataStore()
  return store.records
}

export function getProgressData() {
  const store = getDataStore()
  return store.progressData
}

export function getWorkspace(): Workspace | null {
  const store = getDataStore()
  return store.workspaces[0] ?? null
}

export function getHouseholdProfile(): HouseholdProfile | null {
  const store = getDataStore()
  return store.householdProfiles[0] ?? null
}

export function createWorkspace(name: string, ownerId: string = 'user_current'): Workspace {
  const store = getDataStore()
  const workspace: Workspace = {
    id: `workspace_${Date.now()}`,
    name,
    ownerId,
    createdAt: new Date().toISOString(),
  }
  store.workspaces = [workspace]
  return workspace
}

export function createHouseholdProfile(workspaceId: string, familyName: string): HouseholdProfile {
  const store = getDataStore()
  const profile: HouseholdProfile = {
    id: `household_${Date.now()}`,
    workspaceId,
    familyName,
    createdAt: new Date().toISOString(),
  }
  store.householdProfiles = [profile]
  return profile
}

export function updateHouseholdProfile(familyName: string): HouseholdProfile | null {
  const store = getDataStore()
  const profile = store.householdProfiles[0]
  if (!profile) return null
  profile.familyName = familyName
  return profile
}

export function resetDataStore(): void {
  dataStore = null
}
