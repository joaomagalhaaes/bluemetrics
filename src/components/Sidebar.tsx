'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart2, LogOut, LayoutDashboard,
  MessageCircle, Zap, FileText,
  Settings, TrendingUp, Users, Smartphone, LayoutGrid, Shield, CalendarDays, CreditCard, User
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
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-blue-100 dark:border-gray-800 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-blue-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-400 rounded-xl flex items-center justify-center shadow-md shadow-blue-400/30 flex-shrink-0">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base leading-none">BlueMetrics</p>
            <p className="text-xs text-blue-400 mt-0.5">Meta Ads Analytics</p>
          </div>
        </div>

        {/* Avatar + nome clicável */}
        {user && (
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group">
            <Avatar name={user.name} url={user.avatarUrl} size={38} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                {user.name.split(' ')[0]}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        )}

        {/* Data e hora */}
        <div className="mt-3 text-center bg-blue-50 dark:bg-gray-800 rounded-xl py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{dateStr}</p>
          <p className="text-base font-bold text-blue-400 tracking-widest">{timeStr}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-400 text-white shadow-md shadow-blue-400/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400'
                    }`}>
                    <Icon size={17} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin — só aparece para admin */}
        {user?.role === 'admin' && (
          <div>
            <p className="text-[10px] font-semibold text-red-400 dark:text-red-500 uppercase tracking-widest px-3 mb-1">
              Administrador
            </p>
            <div className="space-y-0.5">
              <Link href="/dashboard/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === '/dashboard/admin'
                    ? 'bg-red-500 text-white shadow-md shadow-red-400/20'
                    : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}>
                <Shield size={17} />
                Painel Admin
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-4 border-t border-blue-100 dark:border-gray-800 space-y-2">
        <ThemeToggle />
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
          <LogOut size={17} /> Sair
        </button>
      </div>
    </aside>
  )
}
