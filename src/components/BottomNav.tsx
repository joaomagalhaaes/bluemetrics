'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CalendarDays, ShoppingBag, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Painel' },
  { href: '/dashboard/calendario', icon: CalendarDays,    label: 'Agenda' },
  { href: '/dashboard/vendas',     icon: ShoppingBag,     label: 'Vendas' },
  { href: '/dashboard/crm',        icon: Users,           label: 'CRM' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Config.' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(7,16,31,0.85) 0%, rgba(7,16,31,0.95) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
            style={{ color: active ? '#60a5fa' : 'rgba(148,186,255,0.4)' }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
