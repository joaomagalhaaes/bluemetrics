'use client'

import { useEffect, useState } from 'react'
import { Eye, ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImpersonationInfo {
  userName: string
  userEmail: string
  userId: string
}

export default function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Lê o cookie "impersonating" (não é httpOnly)
    try {
      const match = document.cookie
        .split('; ')
        .find(c => c.startsWith('impersonating='))
      if (match) {
        const value = decodeURIComponent(match.split('=').slice(1).join('='))
        setInfo(JSON.parse(value))
      }
    } catch {
      // Cookie não existe ou formato inválido
    }
  }, [])

  async function handleBack() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/impersonate', { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/admin')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao voltar')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!info) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 z-50 shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Eye size={16} className="shrink-0" />
        <span className="text-sm font-semibold truncate">
          Acessando como: <span className="font-bold">{info.userName}</span>
          <span className="hidden sm:inline text-amber-100 ml-1">({info.userEmail})</span>
        </span>
      </div>
      <button
        onClick={handleBack}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors shrink-0 disabled:opacity-60"
      >
        <ArrowLeft size={13} />
        {loading ? 'Voltando...' : 'Voltar ao Admin'}
      </button>
    </div>
  )
}
