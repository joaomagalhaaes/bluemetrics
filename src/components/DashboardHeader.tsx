'use client'

import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import ProfileMenu from './ProfileMenu'

export default function DashboardHeader() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-blue-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between gap-3 md:hidden">
      {/* Esquerda: avatar + nome (dropdown) */}
      <ProfileMenu />

      {/* Direita: data/hora + toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right hidden xs:block">
          <p className="text-[10px] text-gray-400 leading-none">{dateStr}</p>
          <p className="text-xs font-bold text-blue-400 leading-none mt-0.5">{timeStr}</p>
        </div>
        <ThemeToggle compact />
      </div>
    </header>
  )
}
