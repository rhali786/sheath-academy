import { AppShell } from '@/features/layout/front/components/AppShell'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
