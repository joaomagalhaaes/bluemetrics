import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import DashboardHeader from '@/components/DashboardHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-blue-50/30 dark:bg-gray-950">
      {/* Sidebar — só desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile com nome + data/hora + toggle */}
        <DashboardHeader />

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Barra inferior mobile */}
      <BottomNav />
    </div>
  )
}
