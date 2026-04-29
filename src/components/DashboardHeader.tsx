'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, BarChart2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function DashboardHeader() {
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

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-blue-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3 md:hidden">
      {/* Esquerda: logo + nome */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 bg-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <BarChart2 size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white leading-none truncate">
            {userName || 'BlueMetrics'}
          </p>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5 truncate">
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      {/* Direita: toggle + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemeToggle compact />
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
