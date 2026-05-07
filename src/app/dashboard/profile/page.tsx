'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Phone, CreditCard, Save, CheckCircle, ArrowLeft, Shield } from 'lucide-react'
import { Avatar } from '@/components/ProfileMenu'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string; name: string; email: string
  cpf?: string | null; phone?: string | null; avatarUrl?: string | null
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 11)
  if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
  if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  return v
}

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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [backLoading, setBackLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d)
      setName(d.name ?? '')
      setCpf(d.cpf ? formatCPF(d.cpf) : '')
      setPhone(d.phone ? formatPhone(d.phone) : '')
    })
    setIsImpersonating(!!getImpersonationInfo())
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cpf: cpf.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Erro ao salvar')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setLoading(false) }
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

  if (!user) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-6">
        <User size={22} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold glass-text-primary">Meu Perfil</h1>
          <p className="text-sm glass-text-muted">Suas informações pessoais</p>
        </div>
      </div>

      {/* Banner Voltar ao Admin */}
      {isImpersonating && (
        <button
          onClick={handleBackToAdmin}
          disabled={backLoading}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,88,12,0.15) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24',
            boxShadow: '0 4px 16px rgba(245,158,11,0.15)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(234,88,12,0.25) 100%)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,88,12,0.15) 100%)')}
        >
          <Shield size={16} />
          <ArrowLeft size={16} />
          {backLoading ? 'Voltando...' : 'Voltar para minha conta (Admin)'}
        </button>
      )}

      {/* Avatar grande */}
      <div className="glass-card p-6 mb-4 text-center">
        <div className="flex justify-center mb-4">
          <Avatar name={user.name} url={user.avatarUrl} size={80} />
        </div>
        <p className="text-lg font-bold glass-text-primary">{user.name}</p>
        <p className="text-sm glass-text-muted">{user.email}</p>
        {user.phone && (
          <p className="text-xs glass-text-muted mt-0.5">{formatPhone(user.phone)}</p>
        )}
        <div
          className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Conta ativa
        </div>
      </div>

      {/* Formulário */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold glass-text-primary mb-4">Editar informações</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium glass-text-secondary mb-1.5">Nome completo</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 glass-text-muted" />
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 glass-input text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium glass-text-secondary mb-1.5">E-mail</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 glass-text-muted" />
              <input value={user.email} disabled
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(148,186,255,0.3)' }} />
            </div>
            <p className="text-xs glass-text-muted mt-1">O e-mail não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium glass-text-secondary mb-1.5">CPF</label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 glass-text-muted" />
              <input type="text" inputMode="numeric" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-4 py-3 glass-input text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium glass-text-secondary mb-1.5">Telefone</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 glass-text-muted" />
              <input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full pl-10 pr-4 py-3 glass-input text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm relative overflow-hidden disabled:opacity-60"
            style={{
              background: 'linear-gradient(180deg, #4f8ef7 0%, #2563eb 48%, #1d4ed8 49%, #1e40af 100%)',
              boxShadow: '0 2px 12px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span className="pointer-events-none absolute top-0 left-0 right-0 h-[50%] rounded-t-xl"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)' }} />
            <span className="relative z-10 flex items-center gap-2">
              {saved
                ? <><CheckCircle size={16} /> Salvo!</>
                : loading
                  ? 'Salvando...'
                  : <><Save size={16} /> Salvar alterações</>
              }
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
