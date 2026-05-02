'use client'

import { useEffect, useState } from 'react'
import { Shield, UserX, UserCheck, Trash2, Users, AlertTriangle, RefreshCw } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  suspended: boolean
  createdAt: string
  _count: { appointments: number; clients: number; leads: number }
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

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
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } finally { setLoading(false) }
  }

  async function handleAction(userId: string, action: 'suspend' | 'reactivate' | 'delete') {
    const labels = { suspend: 'suspender', reactivate: 'reativar', delete: 'EXCLUIR PERMANENTEMENTE' }
    if (!confirm(`Tem certeza que deseja ${labels[action]} esta conta?`)) return

    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Erro')
        return
      }
      await loadUsers()
    } finally { setActionLoading(null) }
  }

  // Tela de acesso negado
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

  const totalUsers = users.length
  const activeUsers = users.filter(u => !u.suspended && u.role !== 'admin').length
  const suspendedUsers = users.filter(u => u.suspended).length

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Painel Admin</h1>
            <p className="text-sm text-gray-400">Gerenciamento de contas de usuários</p>
          </div>
        </div>
        <button onClick={loadUsers} disabled={loading}
          className="p-2 rounded-xl bg-blue-400 text-white disabled:opacity-60">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <Users size={20} className="mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
          <p className="text-xs text-gray-400">Total de contas</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 text-center">
          <UserCheck size={20} className="mx-auto text-green-400 mb-1" />
          <p className="text-2xl font-bold text-green-500">{activeUsers}</p>
          <p className="text-xs text-gray-400">Ativas</p>
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
              {users.map(u => (
                <li key={u.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.suspended ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  {/* Info do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-gray-400">{u._count.clients} conta{u._count.clients !== 1 ? 's' : ''} ads</span>
                      <span className="text-[10px] text-gray-400">{u._count.leads} lead{u._count.leads !== 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-gray-400">{u._count.appointments} agend.</span>
                      <span className="text-[10px] text-gray-400">Desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Ações (não mostrar para o próprio admin) */}
                  {u.role !== 'admin' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {u.suspended ? (
                        <button onClick={() => handleAction(u.id, 'reactivate')}
                          disabled={actionLoading === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                          <UserCheck size={13} />
                          {actionLoading === u.id ? '...' : 'Reativar'}
                        </button>
                      ) : (
                        <button onClick={() => handleAction(u.id, 'suspend')}
                          disabled={actionLoading === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                          <UserX size={13} />
                          {actionLoading === u.id ? '...' : 'Suspender'}
                        </button>
                      )}
                      <button onClick={() => handleAction(u.id, 'delete')}
                        disabled={actionLoading === u.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                        <Trash2 size={13} />
                        {actionLoading === u.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
