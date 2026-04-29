'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart2, LogOut, LayoutDashboard,
  MessageCircle, Zap, Video, FileText, Settings, TrendingUp
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',          icon: LayoutDashboard, label: 'Visão Geral' },
      { href: '/dashboard/messages', icon: MessageCircle,   label: 'Conversas & WhatsApp' },
      { href: '/dashboard/pixel',    icon: Zap,             label: 'Pixel & Conversões' },
      { href: '/dashboard/videos',   icon: Video,           label: 'Vídeos' },
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
      { href: '/dashboard/clients',  icon: TrendingUp,      label: 'Minha Conta' },
      { href: '/dashboard/settings', icon: Settings,        label: 'Configurações' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUserName(d.name ?? ''))
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
      {/* Logo + nome do usuário */}
      <div className="px-5 py-5 border-b border-blue-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-400 rounded-xl flex items-center justify-center shadow-md shadow-blue-400/30 flex-shrink-0">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base leading-none">BlueMetrics</p>
            <p className="text-xs text-blue-400 mt-0.5">Meta Ads Analytics</p>
          </div>
        </div>

        {/* Nome do usuário */}
        {userName && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-xs text-gray-400 leading-none mb-0.5">Bem-vindo,</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
          </div>
        )}

        {/* Data e hora */}
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{dateStr}</p>
          <p className="text-lg font-bold text-blue-400 tracking-widest mt-0.5">{timeStr}</p>
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
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé: toggle + logout */}
      <div className="px-4 py-4 border-t border-blue-100 dark:border-gray-800 space-y-2">
        <ThemeToggle />
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <LogOut size={17} /> Sair
        </button>
      </div>
    </aside>
  )
}
