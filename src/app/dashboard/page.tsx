'use client'

import { useEffect, useState } from 'react'
import {
  RefreshCw, HelpCircle, DollarSign, MousePointer, Eye, Users,
  Target, Activity, BarChart2, MessageCircle, CalendarPlus,
  CheckCircle2, X, Loader2, Calendar, Trash2, TrendingUp, TrendingDown
} from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import SpendChart from '@/components/SpendChart'
import MonthlyComparisonChart from '@/components/MonthlyComparisonChart'

interface Client { id: string; name: string; adAccountId: string; accessToken: string | null }
interface Metrics {
  spend: number; impressions: number; clicks: number
  cpc: number; cpm: number; ctr: number
  reach: number; frequency: number; conversions: number; roas: number
  conversationsStarted?: number; costPerConversation?: number
  leads?: number; costPerLead?: number
}
interface MonthlyData {
  month: string; spend: number; clicks: number
  impressions: number; conversions: number; roas: number
  conversationsStarted?: number
}
interface Appointment {
  id: string; clientName: string; service: string | null
  value: number; date: string; notes: string | null; status: string
}
interface AppointmentSummary {
  total: number; totalValue: number
  completed: number; completedValue: number
  scheduled: number; cancelled: number
}

const PERIODS = [
  { value: 'today',      label: 'Hoje' },
  { value: 'yesterday',  label: 'Ontem' },
  { value: 'last_7d',    label: '7 dias' },
  { value: 'last_30d',   label: '30 dias' },
  { value: 'last_month', label: 'Mês passado' },
]

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('last_30d')
  const [isMock, setIsMock] = useState(false)

  // Agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [apptSummary, setApptSummary] = useState<AppointmentSummary | null>(null)
  const [showApptForm, setShowApptForm] = useState(false)
  const [apptLoading, setApptLoading] = useState(false)
  const [apptForm, setApptForm] = useState({ clientName: '', service: '', value: '', date: '', notes: '' })

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(data)
      if (data.length > 0) setSelectedClientId(data[0].id)
    })
    loadAppointments()
  }, [])

  useEffect(() => { if (selectedClientId) loadMetrics() }, [selectedClientId, period])

  async function loadMetrics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta/metrics?clientId=${selectedClientId}&datePreset=${period}`)
      const data = await res.json()
      setMetrics(data.metrics)
      setMonthly(data.monthly)
      setIsMock(data.mock)
    } finally { setLoading(false) }
  }

  async function loadAppointments() {
    const res = await fetch('/api/appointments?period=month')
    if (res.ok) {
      const data = await res.json()
      setAppointments(data.appointments)
      setApptSummary(data.summary)
    }
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault()
    setApptLoading(true)
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apptForm),
    })
    setApptForm({ clientName: '', service: '', value: '', date: '', notes: '' })
    setShowApptForm(false)
    await loadAppointments()
    setApptLoading(false)
  }

  async function completeAppointment(id: string) {
    await fetch('/api/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed' }),
    })
    await loadAppointments()
  }

  async function cancelAppointment(id: string) {
    await fetch('/api/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    })
    await loadAppointments()
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Remover agendamento?')) return
    await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
    await loadAppointments()
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
    percent: (v: number) => `${v.toFixed(2)}%`,
  }

  // Cálculo de lucro
  const investido = metrics?.spend ?? 0
  const faturado = apptSummary?.completedValue ?? 0
  const lucro = faturado - investido
  const roi = investido > 0 ? ((faturado / investido) - 1) * 100 : 0

  return (
    <div className="max-w-2xl md:max-w-5xl mx-auto px-4 pt-4 pb-4">
      {/* Título + filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Visão Geral</h1>
          <p className="text-xs text-gray-400">Métricas em tempo real dos seus anúncios</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {clients.length > 1 && (
            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <div className="flex gap-1 overflow-x-auto">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-400 text-white shadow-sm shadow-blue-400/30'
                    : 'bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                }`}>{p.label}</button>
            ))}
          </div>
          <button onClick={loadMetrics} disabled={loading}
            className="flex-shrink-0 p-2 rounded-xl bg-blue-400 text-white disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sem clientes */}
      {clients.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
            <BarChart2 size={28} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Configure sua conta</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Vá em <strong>Minha Conta</strong> para conectar seu gerenciador de anúncios.
          </p>
          <a href="/dashboard/clients" className="px-6 py-3 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl">
            Configurar agora
          </a>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {metrics && !loading && (
        <>
          {isMock && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <HelpCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Dados de exemplo</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Configure seu Token de Acesso em <a href="/dashboard/clients" className="underline font-medium">Minha Conta</a> para ver dados reais.
                </p>
              </div>
            </div>
          )}

          {/* ═══ DESTAQUE: INVESTIMENTO ═══ */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 mb-4 shadow-xl shadow-blue-500/30 text-white">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-blue-200 text-sm font-medium">Valor investido em anúncios</p>
                <p className="text-4xl font-bold mt-1">{fmt.currency(metrics.spend)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
            {/* Resumo financeiro */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-[10px] uppercase font-medium">Faturado (agendamentos)</p>
                <p className="text-lg font-bold">{fmt.currency(faturado)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] uppercase font-medium">Lucro</p>
                <p className={`text-lg font-bold ${lucro >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {lucro >= 0 ? '+' : ''}{fmt.currency(lucro)}
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] uppercase font-medium">ROI</p>
                <p className="text-lg font-bold flex items-center gap-1">
                  {roi >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {roi.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* ═══ MÉTRICAS PRINCIPAIS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard title="Conversas iniciadas" value={fmt.number(metrics.conversationsStarted ?? 0)} icon={MessageCircle} color="green"
              subtitle={metrics.costPerConversation ? `${fmt.currency(metrics.costPerConversation)} cada` : 'Via WhatsApp/Messenger'} />
            <MetricCard title="Pessoas clicaram"    value={fmt.number(metrics.clicks)}           icon={MousePointer} color="blue"   subtitle={`CTR ${fmt.percent(metrics.ctr)}`} />
            <MetricCard title="Pessoas alcançadas"   value={fmt.number(metrics.reach)}            icon={Users}        color="purple" subtitle={`${metrics.frequency.toFixed(1)}x por pessoa`} />
            <MetricCard title="Vezes que apareceu"   value={fmt.number(metrics.impressions)}      icon={Eye}          color="orange" subtitle="Impressões" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MetricCard title="Custo por clique"    value={fmt.currency(metrics.cpc)}            icon={Target}    color="blue"   subtitle="CPC" />
            <MetricCard title="Custo por conversa"  value={fmt.currency(metrics.costPerConversation ?? 0)} icon={MessageCircle} color="green"  subtitle="Por mensagem" />
            <MetricCard title="Custo por 1000 views" value={fmt.currency(metrics.cpm)}           icon={Activity}  color="purple" subtitle="CPM" />
            <MetricCard title="Taxa de cliques"     value={fmt.percent(metrics.ctr)}             icon={MousePointer} color="orange" subtitle="CTR" />
          </div>

          {/* ═══ AGENDAMENTOS ═══ */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white">Agendamentos do mês</h2>
                  {apptSummary && (
                    <p className="text-[10px] text-gray-400">
                      {apptSummary.total} agendamento{apptSummary.total !== 1 ? 's' : ''} · {fmt.currency(apptSummary.totalValue)} total
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium">{apptSummary?.total ?? 0}/30</span>
                <button onClick={() => {
                  if ((apptSummary?.total ?? 0) >= 30) { alert('Limite de 30 agendamentos por mês atingido.'); return }
                  setShowApptForm(v => !v)
                }}
                  disabled={(apptSummary?.total ?? 0) >= 30}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                  <CalendarPlus size={13} />
                  Novo agendamento
                </button>
              </div>
            </div>

            {/* Resumo de agendamentos */}
            {apptSummary && apptSummary.total > 0 && (
              <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-blue-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Agendados</p>
                  <p className="text-lg font-bold text-blue-500">{apptSummary.scheduled}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Realizados</p>
                  <p className="text-lg font-bold text-green-500">{apptSummary.completed}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Valor realizado</p>
                  <p className="text-lg font-bold text-green-500">{fmt.currency(apptSummary.completedValue)}</p>
                </div>
              </div>
            )}

            {/* Form */}
            {showApptForm && (
              <form onSubmit={addAppointment} className="px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Nome do cliente *</label>
                    <input required value={apptForm.clientName} onChange={e => setApptForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="Ex: Maria Silva"
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Serviço</label>
                    <input value={apptForm.service} onChange={e => setApptForm(f => ({ ...f, service: e.target.value }))}
                      placeholder="Ex: Consulta, Corte..."
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Valor (R$) *</label>
                    <input required type="number" step="0.01" min="0" value={apptForm.value}
                      onChange={e => setApptForm(f => ({ ...f, value: e.target.value }))}
                      placeholder="150.00"
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Data/Hora *</label>
                    <input required type="datetime-local" value={apptForm.date}
                      onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Observações</label>
                  <input value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observação opcional..."
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={apptLoading}
                    className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg">
                    {apptLoading ? 'Salvando...' : 'Salvar agendamento'}
                  </button>
                  <button type="button" onClick={() => setShowApptForm(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de agendamentos */}
            {appointments.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">Nenhum agendamento este mês</p>
                <p className="text-xs text-gray-400 mt-1">A secretária pode adicionar aqui quando agendar um cliente</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
                {appointments.slice(0, 30).map(a => (
                  <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      a.status === 'completed' ? 'bg-green-400' :
                      a.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {a.clientName}
                        {a.service && <span className="text-gray-400 font-normal"> · {a.service}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white shrink-0">{fmt.currency(a.value)}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {a.status === 'scheduled' && (
                        <button onClick={() => completeAppointment(a.id)} title="Marcar como realizado"
                          className="p-1 rounded text-gray-300 hover:text-green-500 transition-colors">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {a.status === 'scheduled' && (
                        <button onClick={() => cancelAppointment(a.id)} title="Cancelar"
                          className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteAppointment(a.id)} title="Remover"
                        className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendChart data={monthly} />
            <MonthlyComparisonChart data={monthly} />
          </div>
        </>
      )}
    </div>
  )
}
