'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Zap, Video, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Painel' },
  { href: '/dashboard/crm',      icon: Users,           label: 'CRM' },
  { href: '/dashboard/pixel',    icon: Zap,             label: 'Pixel' },
  { href: '/dashboard/videos',   icon: Video,           label: 'Vídeos' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Config.' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-blue-100 dark:border-gray-800 flex md:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              active ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
