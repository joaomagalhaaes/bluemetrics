'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Phone, CreditCard, Save, CheckCircle } from 'lucide-react'
import { Avatar } from '@/components/ProfileMenu'

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

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d)
      setName(d.name ?? '')
      setCpf(d.cpf ? formatCPF(d.cpf) : '')
      setPhone(d.phone ? formatPhone(d.phone) : '')
    })
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
          <p className="text-sm text-gray-400">Suas informações pessoais</p>
        </div>
      </div>

      {/* Avatar grande */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-blue-100 dark:border-gray-800 p-6 mb-4 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <Avatar name={user.name} url={user.avatarUrl} size={80} />
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</p>
        <p className="text-sm text-gray-400">{user.email}</p>
        {user.phone && (
          <p className="text-xs text-gray-400 mt-0.5">{formatPhone(user.phone)}</p>
        )}
        <div className="inline-flex items-center gap-1.5 mt-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Conta ativa
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Editar informações</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome completo
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>

          {/* E-mail (somente leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              CPF
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={e => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Telefone
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-400/20"
          >
            {saved
              ? <><CheckCircle size={16} /> Salvo!</>
              : loading
                ? 'Salvando...'
                : <><Save size={16} /> Salvar alterações</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
