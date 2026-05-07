'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart2, LogOut, LayoutDashboard,
  MessageCircle, Zap, FileText,
  Settings, TrendingUp, Users, Smartphone, LayoutGrid, Shield, CalendarDays, CreditCard, User, ShoppingBag
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { Avatar } from './ProfileMenu'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',              icon: LayoutDashboard, label: 'Visão Geral' },
      { href: '/dashboard/gerenciador',  icon: LayoutGrid,      label: 'Gerenciador' },
      { href: '/dashboard/calendario',   icon: CalendarDays,    label: 'Calendário' },
      { href: '/dashboard/vendas',       icon: ShoppingBag,     label: 'Vendas' },
      { href: '/dashboard/messages',     icon: MessageCircle,   label: 'Conversas & WhatsApp' },
      { href: '/dashboard/pixel',        icon: Zap,             label: 'Pixel & Conversões' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/dashboard/crm',       icon: Users,       label: 'Leads & CRM' },
      { href: '/dashboard/whatsapp',  icon: Smartphone,  label: 'Conectar WhatsApp' },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { href: '/dashboard/reports',  icon: FileText,        label: 'Relatórios' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/dashboard/clients',  icon: TrendingUp,   label: 'Conta de Anúncios' },
      { href: '/dashboard/profile',  icon: User,          label: 'Meu Perfil' },
      { href: '/dashboard/billing',  icon: CreditCard,   label: 'Assinatura' },
      { href: '/dashboard/settings', icon: Settings,     label: 'Configurações' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; avatarUrl?: string; role?: string } | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #3b82f6 0%, #1d4ed8 60%, #1e3a8a 100%)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[42%]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)' }} />
            <BarChart2 size={18} className="text-white relative z-10" />
          </div>
          <div>
            <p className="font-bold text-base leading-none" style={{ color: '#e8f0ff' }}>BlueMetrics</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(96,165,250,0.7)' }}>Meta Ads Analytics</p>
          </div>
        </div>

        {/* Avatar + nome */}
        {user && (
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all group"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Avatar name={user.name} url={user.avatarUrl} size={38} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate transition-colors" style={{ color: '#e8f0ff' }}>
                {user.name.split(' ')[0]}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(148,186,255,0.5)' }}>{user.email}</p>
            </div>
          </Link>
        )}

        {/* Data e hora */}
        <div
          className="mt-3 text-center rounded-xl py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs capitalize" style={{ color: 'rgba(148,186,255,0.5)' }}>{dateStr}</p>
          <p className="text-base font-bold tracking-widest" style={{ color: '#60a5fa' }}>{timeStr}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: 'rgba(148,186,255,0.35)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.25) 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      border: '1px solid rgba(96,165,250,0.25)',
                    } : {
                      color: 'rgba(180,210,255,0.6)',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; if (!active) e.currentTarget.style.color = 'rgba(200,225,255,0.9)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = 'rgba(180,210,255,0.6)' }}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin */}
        {user?.role === 'admin' && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: 'rgba(239,68,68,0.5)' }}>
              Administrador
            </p>
            <div className="space-y-0.5">
              <Link href="/dashboard/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={pathname === '/dashboard/admin' ? {
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)',
                  color: '#fca5a5',
                  boxShadow: '0 2px 12px rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.25)',
                } : {
                  color: 'rgba(252,165,165,0.6)',
                }}
              >
                <Shield size={17} />
                Painel Admin
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <ThemeToggle />
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(180,210,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(180,210,255,0.5)' }}
        >
          <LogOut size={17} /> Sair
        </button>
      </div>
    </aside>
  )
}
