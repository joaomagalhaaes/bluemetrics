'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, User, Settings, LogOut, ChevronDown } from 'lucide-react'

interface UserData { name: string; email: string; avatarUrl?: string }

function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  if (url) return <img src={url} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <div
      className="rounded-full bg-blue-400 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md shadow-blue-400/30"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

export { Avatar }

export default function ProfileMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
  }, [])

  // Fecha ao clicar fora
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

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      {/* Botão do avatar */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group"
      >
        <Avatar name={user.name} url={user.avatarUrl} size={34} />
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none truncate max-w-[120px]">
            {user.name.split(' ')[0]}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">{user.email}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-blue-100 dark:border-gray-800 overflow-hidden z-50">
          {/* Info do usuário */}
          <div className="px-4 py-3 border-b border-blue-50 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} url={user.avatarUrl} size={38} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            <Link href="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium">
              <LayoutDashboard size={16} /> Visão Geral
            </Link>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium">
              <User size={16} /> Meu Perfil
            </Link>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium">
              <Settings size={16} /> Configurações
            </Link>
          </div>

          <div className="p-1.5 border-t border-blue-50 dark:border-gray-800">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
