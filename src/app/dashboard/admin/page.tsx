'use client'

import { useEffect, useState } from 'react'
import { Shield, UserX, UserCheck, Trash2, Users, AlertTriangle, RefreshCw, KeyRound, Lock, CreditCard, Clock, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubInfo {
  status: string
  plan: string | null
  trialEnd: string | null
  currentPeriodEnd: string | null
  gracePeriodEnd: string | null
}

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  suspended: boolean
  adminApproved: boolean
  createdAt: string
  subscription: SubInfo | null
  _count: { appointments: number; clients: number; leads: number }
}

function subStatusLabel(u: AdminUser): { label: string; color: string } {
  if (u.adminApproved) return { label: 'Liberado pelo Admin', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' }
  if (u.suspended) return { label: 'Suspensa', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' }
  if (!u.subscription) return { label: 'Sem assinatura', color: 'text-gray-400 bg-gray-50 dark:bg-gray-800' }
  const s = u.subscription.status
  if (s === 'active') return { label: `Ativa — ${u.subscription.plan === 'annual' ? 'Anual' : 'Mensal'}`, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' }
  if (s === 'trial') {
    const end = u.subscription.trialEnd ? new Date(u.subscription.trialEnd) : null
    const days = end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : 0
    return { label: `Trial — ${days}d restantes`, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' }
  }
  if (s === 'grace') return { label: 'Pagamento pendente', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' }
  if (s === 'cancelled') return { label: 'Cancelada', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' }
  if (s === 'suspended') return { label: 'Suspensa (pagamento)', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' }
  return { label: s, color: 'text-gray-400 bg-gray-50 dark:bg-gray-800' }
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const meRes = await fetch('/api/auth/me')
    const me = await meRes.json()
    if (me.role === 'admin') {
      setIsAdmin(true)
      await loadUsers()
    } else {
      setIsAdmin(false)
      setLoading(false)
    }
  }

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally { setLoading(false) }
  }

  async function handleImpersonate(userId: string, userName: string) {
    if (!confirm(`Acessar a conta de "${userName}" como se fosse sua?`)) return
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Erro'); return }
      // Redireciona para o dashboard do usuário
      router.push('/dashboard')
      router.refresh()
    } finally { setActionLoading(null) }
  }

  async function handleAction(userId: string, action: string, confirmMsg: string) {
    if (!confirm(confirmMsg)) return
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Erro'); return }
      await loadUsers()
    } finally { setActionLoading(null) }
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={30} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acesso restrito</h1>
        <p className="text-sm text-gray-400">Esta página é exclusiva para administradores.</p>
      </div>
    )
  }

  const nonAdminUsers = users.filter(u => u.role !== 'admin')
  const totalUsers = nonAdminUsers.length
  const activeUsers = nonAdminUsers.filter(u => !u.suspended && (u.adminApproved || u.subscription?.status === 'active' || u.subscription?.status === 'trial')).length
  const suspendedUsers = nonAdminUsers.filter(u => u.suspended).length
  const approvedUsers = nonAdminUsers.filter(u => u.adminApproved).length

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel Admin</h1>
            <p className="text-sm text-gray-400">Controle total das contas de usuários</p>
          </div>
        </div>
        <button onClick={loadUsers} disabled={loading}
          className="p-2 rounded-xl bg-blue-400 text-white disabled:opacity-60">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <Users size={20} className="mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <UserCheck size={20} className="mx-auto text-green-400 mb-1" />
          <p className="text-2xl font-bold text-green-500">{activeUsers}</p>
          <p className="text-xs text-gray-400">Ativas</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <KeyRound size={20} className="mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold text-blue-500">{approvedUsers}</p>
          <p className="text-xs text-gray-400">Liberadas por mim</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <UserX size={20} className="mx-auto text-red-400 mb-1" />
          <p className="text-2xl font-bold text-red-500">{suspendedUsers}</p>
          <p className="text-xs text-gray-400">Suspensas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Todas as contas</h2>
          </div>
          {users.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Nenhum usuário encontrado</div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map(u => {
                const st = subStatusLabel(u)
                const isLoading = actionLoading === u.id
                return (
                  <li key={u.id} className={`px-5 py-4 ${u.suspended ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase">Admin</span>
                          )}
                          {u.suspended && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full uppercase flex items-center gap-0.5">
                              <AlertTriangle size={9} /> Suspensa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>

                        {/* Status da assinatura */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                            {u.adminApproved ? <KeyRound size={9} /> : <CreditCard size={9} />}
                            {st.label}
                          </span>
                          {u.subscription?.trialEnd && u.subscription.status === 'trial' && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={9} /> Trial até {new Date(u.subscription.trialEnd).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {u.subscription?.currentPeriodEnd && u.subscription.status === 'active' && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={9} /> Renova em {new Date(u.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-gray-400">{u._count.clients} conta{u._count.clients !== 1 ? 's' : ''} ads</span>
                          <span className="text-[10px] text-gray-400">{u._count.leads} lead{u._count.leads !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] text-gray-400">{u._count.appointments} agend.</span>
                          <span className="text-[10px] text-gray-400">Desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Ações */}
                      {u.role !== 'admin' && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Acessar conta */}
                          <button onClick={() => handleImpersonate(u.id, u.name)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                            <Eye size={13} />
                            {isLoading ? '...' : 'Acessar conta'}
                          </button>

                          {/* Liberar / Bloquear acesso */}
                          {u.adminApproved ? (
                            <button onClick={() => handleAction(u.id, 'revoke_access', 'Remover acesso liberado? O usuário precisará ter assinatura ativa.')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                              <Lock size={13} />
                              {isLoading ? '...' : 'Revogar acesso'}
                            </button>
                          ) : (
                            <button onClick={() => handleAction(u.id, 'grant_access', 'Liberar acesso total? O usuário poderá usar sem precisar pagar.')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                              <KeyRound size={13} />
                              {isLoading ? '...' : 'Liberar acesso'}
                            </button>
                          )}

                          {/* Suspender / Reativar */}
                          {u.suspended ? (
                            <button onClick={() => handleAction(u.id, 'reactivate', 'Reativar esta conta?')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                              <UserCheck size={13} />
                              {isLoading ? '...' : 'Reativar'}
                            </button>
                          ) : (
                            <button onClick={() => handleAction(u.id, 'suspend', 'Suspender esta conta? O usuário não poderá acessar.')}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                              <UserX size={13} />
                              {isLoading ? '...' : 'Suspender'}
                            </button>
                          )}

                          {/* Excluir */}
                          <button onClick={() => handleAction(u.id, 'delete', 'EXCLUIR PERMANENTEMENTE esta conta? Todos os dados serão perdidos.')}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                            <Trash2 size={13} />
                            {isLoading ? '...' : 'Excluir'}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
