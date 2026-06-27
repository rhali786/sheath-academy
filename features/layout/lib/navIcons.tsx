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
  MessageCircle,
  Inbox,
  Trophy,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'

export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: Home,
  calendar: Calendar,
  'lesson-planner': BookOpen,
  courses: Layers3,
  attendance: ClipboardCheck,
  'grades-progress': BarChart3,
  gradebook: GraduationCap,
  badges: Trophy,
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
  'my-feedback': MessageCircle,
  'feedback-queue': Inbox,
}

export function getNavIcon(id: string): LucideIcon | undefined {
  return NAV_ICONS[id]
}

/** Icons for NAV_MODULES sidebar headers (module id, not leaf item id). */
export const MODULE_ICONS: Record<string, LucideIcon> = {
  home: Home,
  planbook: BookOpen,
  records: ClipboardCheck,
  growth: TrendingUp,
  progress: BarChart3,
  people: Users,
  messages: MessageSquare,
  settings: Settings,
}

export function getModuleIcon(moduleId: string): LucideIcon | undefined {
  return MODULE_ICONS[moduleId]
}
