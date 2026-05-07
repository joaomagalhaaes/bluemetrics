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
    <header
      className="sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between gap-3 md:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(7,16,31,0.9) 0%, rgba(7,16,31,0.8) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <ProfileMenu />

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right hidden xs:block">
          <p className="text-[10px] leading-none" style={{ color: 'rgba(148,186,255,0.45)' }}>{dateStr}</p>
          <p className="text-xs font-bold leading-none mt-0.5" style={{ color: '#60a5fa' }}>{timeStr}</p>
        </div>
        <ThemeToggle compact />
      </div>
    </header>
  )
}
