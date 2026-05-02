import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkSubscription } from '@/lib/subscription'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import DashboardHeader from '@/components/DashboardHeader'
import SubscriptionBanner from '@/components/SubscriptionBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, suspended: true },
  })

  if (!user || user.suspended) redirect('/')

  const result = await checkSubscription(session.userId, user.role)

  if (!result.allowed) {
    redirect(`/billing?reason=${result.reason}`)
  }

  const banner = result.banner
  const daysLeft = 'daysLeft' in result ? (result.daysLeft ?? 0) : 0

  return (
    <div className="flex min-h-screen bg-blue-50/30 dark:bg-gray-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        {banner && <SubscriptionBanner type={banner} daysLeft={daysLeft} />}

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
