'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag, Plus, Loader2, CheckCircle2, X, Trash2, Pencil,
  DollarSign, TrendingUp, Package, Calendar, Building2
} from 'lucide-react'

interface Client { id: string; name: string; adAccountId: string }
interface Sale {
  id: string; product: string; clientName: string; value: number
  date: string; notes: string | null; status: string
  client?: { id: string; name: string; adAccountId: string } | null
}
interface SaleSummary {
  total: number; totalValue: number
  completed: number; completedValue: number; cancelled: number
}

const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: '7 dias' },
  { value: 'last_30d', label: '30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_90d', label: '90 dias' },
]

export default function VendasPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<SaleSummary | null>(null)
  const [period, setPeriod] = useState('this_month')
  const [loading, setLoading] = useState(false)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ product: '', clientName: '', value: '', date: '', notes: '', clientId: '' })

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(data)
      if (data.length === 1) {
        setForm(f => ({ ...f, clientId: data[0].id }))
      }
    })
  }, [])

  useEffect(() => {
    loadSales()
  }, [selectedClientId, period])

  async function loadSales() {
    setLoading(true)
    try {
      let url = `/api/sales?period=${period}`
      if (selectedClientId) url += `&clientId=${selectedClientId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSales(data.sales)
        setSummary(data.summary)
      }
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setEditingId(null)
    const now = new Date()
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const localTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setForm({
      product: '', clientName: '', value: '', date: `${localDate}T${localTime}`,
      notes: '', clientId: clients.length === 1 ? clients[0].id : ''
    })
    setShowForm(true)
  }

  function openEditForm(sale: Sale) {
    setEditingId(sale.id)
    const d = new Date(sale.date)
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const localTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    setForm({
      product: sale.product,
      clientName: sale.clientName,
      value: String(sale.value),
      date: `${localDate}T${localTime}`,
      notes: sale.notes ?? '',
      clientId: sale.client?.id ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      const isoDate = new Date(form.date).toISOString()
      if (editingId) {
        const res = await fetch('/api/sales', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form, date: isoDate }),
        })
        if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Erro'); return }
      } else {
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, date: isoDate }),
        })
        if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Erro'); return }
      }
      setShowForm(false)
      setEditingId(null)
      await loadSales()
    } finally {
      setFormLoading(false)
    }
  }

  async function cancelSale(id: string) {
    await fetch('/api/sales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    })
    await loadSales()
  }

  async function restoreSale(id: string) {
    await fetch('/api/sales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed' }),
    })
    await loadSales()
  }

  async function deleteSale(id: string) {
    if (!confirm('Remover venda?')) return
    await fetch(`/api/sales?id=${id}`, { method: 'DELETE' })
    await loadSales()
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Agrupar por adAccountId para seletor
  const adAccounts = clients.reduce<Record<string, { adAccountId: string; names: string[]; clientIds: string[] }>>((acc, c) => {
    if (!acc[c.adAccountId]) acc[c.adAccountId] = { adAccountId: c.adAccountId, names: [], clientIds: [] }
    acc[c.adAccountId].names.push(c.name)
    acc[c.adAccountId].clientIds.push(c.id)
    return acc
  }, {})

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-emerald-500" />
            Vendas
          </h1>
          <p className="text-xs text-gray-400">Registre vendas de produtos e acompanhe o faturamento</p>
        </div>
        <button onClick={openNewForm}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
          <Plus size={15} /> Nova Venda
        </button>
      </div>

      {/* Seletor de conta */}
      {Object.keys(adAccounts).length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setSelectedClientId('')}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !selectedClientId
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            Todas as contas
          </button>
          {Object.values(adAccounts).map(acc => (
            <button key={acc.adAccountId} onClick={() => setSelectedClientId(acc.clientIds[0])}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                acc.clientIds.includes(selectedClientId)
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {acc.names[0]}
            </button>
          ))}
        </div>
      )}

      {/* Filtro de período */}
      <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              period === p.value
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Package size={16} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total de vendas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Valor total</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(summary.completedValue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ticket médio</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.completed > 0 ? fmt(summary.completedValue / summary.completed) : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <X size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Canceladas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.cancelled}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-5 overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {editingId ? '✏️ Editando venda' : '🛒 Nova venda'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Produto / Serviço *</label>
                <input required value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  placeholder="Ex: Kit Skincare, Botox..."
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Nome do cliente *</label>
                <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Ex: Maria Silva"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Valor (R$) *</label>
                <input required type="number" step="0.01" min="0" value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="150.00"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Data/Hora</label>
                <input type="datetime-local" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Conta de anúncios *</label>
                <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Observações</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observação opcional..."
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={formLoading}
                className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5">
                {formLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {editingId ? 'Salvar alterações' : 'Registrar venda'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-500" />
            Vendas registradas
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
          </div>
        ) : sales.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ShoppingBag size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">Nenhuma venda registrada</p>
            <p className="text-xs text-gray-400 mt-1">Clique em &quot;Nova Venda&quot; para adicionar</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {sales.map(sale => (
              <li key={sale.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  sale.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {sale.product}
                    <span className="text-gray-400 font-normal"> · {sale.clientName}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Calendar size={10} />
                      {new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {sale.client && (
                      <span className="flex items-center gap-0.5 text-purple-400">
                        <Building2 size={10} />
                        {sale.client.name}
                      </span>
                    )}
                    {sale.notes && <span className="truncate max-w-[150px]">· {sale.notes}</span>}
                  </div>
                </div>
                <p className={`text-sm font-bold shrink-0 ${
                  sale.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-400 line-through'
                }`}>
                  {fmt(sale.value)}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditForm(sale)} title="Editar"
                    className="p-1 rounded text-gray-300 hover:text-emerald-500 transition-colors">
                    <Pencil size={13} />
                  </button>
                  {sale.status === 'completed' && (
                    <button onClick={() => cancelSale(sale.id)} title="Cancelar venda"
                      className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                  {sale.status === 'cancelled' && (
                    <button onClick={() => restoreSale(sale.id)} title="Restaurar"
                      className="p-1 rounded text-gray-300 hover:text-green-500 transition-colors">
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteSale(sale.id)} title="Remover"
                    className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
