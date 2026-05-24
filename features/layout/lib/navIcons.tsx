import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Calendar,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  FileText,
  Users,
  FolderOpen,
  BookMarked,
  MessageSquare,
  CircleDollarSign,
  ShieldCheck,
  Settings,
  Shield,
  Info,
  Layers3,
} from 'lucide-react'

export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: Home,
  calendar: Calendar,
  'lesson-planner': BookOpen,
  courses: Layers3,
  attendance: ClipboardCheck,
  'grades-progress': BarChart3,
  'reports-records': FileText,
  people: Users,
  resources: FolderOpen,
  quran: BookMarked,
  messages: MessageSquare,
  finances: CircleDollarSign,
  compliance: ShieldCheck,
  settings: Settings,
  admin: Shield,
  about: Info,
}

export function getNavIcon(id: string): LucideIcon | undefined {
  return NAV_ICONS[id]
}
