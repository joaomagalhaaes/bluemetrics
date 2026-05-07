'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, User, Settings, LogOut, ChevronDown, ArrowLeft, Shield } from 'lucide-react'

interface UserData { name: string; email: string; avatarUrl?: string }

function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  if (url) return <img src={url} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 relative overflow-hidden"
      style={{
        width: size, height: size, fontSize: size * 0.35,
        background: 'linear-gradient(160deg, #3b82f6 0%, #1d4ed8 100%)',
        boxShadow: '0 4px 12px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[45%]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)' }} />
      <span className="relative z-10">{initials}</span>
    </div>
  )
}

export { Avatar }

function getImpersonationInfo(): { userName: string; userEmail: string; userId: string } | null {
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith('impersonating='))
    if (match) {
      const value = decodeURIComponent(match.split('=').slice(1).join('='))
      return JSON.parse(value)
    }
  } catch { /* nada */ }
  return null
}

export default function ProfileMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [backLoading, setBackLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
    setIsImpersonating(!!getImpersonationInfo())
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function handleBackToAdmin() {
    setBackLoading(true)
    try {
      const res = await fetch('/api/admin/impersonate', { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/admin')
        router.refresh()
      }
    } finally { setBackLoading(false) }
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl transition-all group"
        style={{ background: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Avatar name={user.name} url={user.avatarUrl} size={34} />
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold leading-none truncate max-w-[120px]" style={{ color: '#e8f0ff' }}>
            {user.name.split(' ')[0]}
          </p>
          <p className="text-xs mt-0.5 truncate max-w-[120px]" style={{ color: 'rgba(148,186,255,0.5)' }}>{user.email}</p>
        </div>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'rgba(148,186,255,0.4)' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'linear-gradient(145deg, rgba(15,26,46,0.95) 0%, rgba(7,16,31,0.98) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Info do usuário */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={user.name} url={user.avatarUrl} size={38} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#e8f0ff' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(148,186,255,0.5)' }}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Botão Voltar ao Admin */}
          {isImpersonating && (
            <div className="p-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={handleBackToAdmin} disabled={backLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
              >
                <ArrowLeft size={16} />
                {backLoading ? 'Voltando...' : 'Voltar ao Admin'}
              </button>
            </div>
          )}

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            {[
              { href: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
              { href: '/dashboard/profile', icon: User, label: 'Meu Perfil' },
              { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: 'rgba(180,210,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e8f0ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(180,210,255,0.6)' }}
              >
                <item.icon size={16} /> {item.label}
              </Link>
            ))}
          </div>

          <div className="p-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: 'rgba(252,165,165,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(252,165,165,0.7)' }}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
