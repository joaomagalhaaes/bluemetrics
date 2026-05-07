import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkSubscription } from '@/lib/subscription'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import DashboardHeader from '@/components/DashboardHeader'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import SatisfactionPopup from '@/components/SatisfactionPopup'
import ImpersonationBanner from '@/components/ImpersonationBanner'

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
  const isTrial = result.allowed && result.status === 'trial'

  return (
    <div
      className="flex min-h-screen relative"
      style={{
        background: '#07101f',
        backgroundImage: `
          radial-gradient(ellipse 70% 60% at 10% 5%, rgba(37,99,235,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 90% 85%, rgba(79,70,229,0.14) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(14,165,233,0.05) 0%, transparent 70%)
        `,
      }}
    >
      {/* Grid sutil de fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="hidden md:block relative z-10">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <ImpersonationBanner />
        <DashboardHeader />

        {banner && <SubscriptionBanner type={banner} daysLeft={daysLeft} />}

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />

      {isTrial && <SatisfactionPopup />}
    </div>
  )
}
