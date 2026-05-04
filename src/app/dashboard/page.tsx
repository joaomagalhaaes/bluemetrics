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

interface Client { id: string; name: string; adAccountId: string; hasToken: boolean }
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
  leads: number; conversationsStarted?: number
  appointments?: number; revenue?: number
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
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_90d',   label: '90 dias' },
  { value: 'custom',     label: 'Personalizado' },
]

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('last_30d')
  const [customSince, setCustomSince] = useState('')
  const [customUntil, setCustomUntil] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
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
  }, [])

  const isCustom = period === 'custom' && customSince && customUntil

  useEffect(() => {
    if (period === 'custom' && (!customSince || !customUntil)) return
    if (selectedClientId) loadMetrics()
    loadAppointments()
  }, [selectedClientId, period, customSince, customUntil])

  async function loadMetrics() {
    setLoading(true)
    try {
      let url = `/api/meta/metrics?clientId=${selectedClientId}`
      if (isCustom) {
        url += `&since=${customSince}&until=${customUntil}`
      } else {
        url += `&datePreset=${period}`
      }
      const [res, apptMonthlyRes] = await Promise.all([
        fetch(url),
        fetch('/api/appointments/monthly'),
      ])
      const data = await res.json()
      const apptMonthly = apptMonthlyRes.ok ? await apptMonthlyRes.json() : []

      if (res.ok && data.metrics) {
        setMetrics(data.metrics)
        // Mesclar dados mensais de Meta + agendamentos
        const metaMonthly: MonthlyData[] = data.monthly ?? []
        const merged = metaMonthly.map(m => {
          const appt = apptMonthly.find((a: { month: string }) => a.month === m.month)
          return { ...m, appointments: appt?.appointments ?? 0, revenue: appt?.revenue ?? 0 }
        })
        setMonthly(merged)
        setIsMock(data.mock ?? false)
      } else {
        setMetrics({
          spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0,
          reach: 0, frequency: 0, conversions: 0, roas: 0,
          conversationsStarted: 0, costPerConversation: 0, leads: 0, costPerLead: 0,
        })
        setMonthly([])
        setIsMock(true)
      }
    } catch {
      setMetrics({
        spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0,
        reach: 0, frequency: 0, conversions: 0, roas: 0,
        conversationsStarted: 0, costPerConversation: 0, leads: 0, costPerLead: 0,
      })
      setMonthly([])
      setIsMock(true)
    } finally { setLoading(false) }
  }

  async function loadAppointments() {
    let url = `/api/appointments`
    if (isCustom) {
      url += `?since=${customSince}&until=${customUntil}`
    } else {
      url += `?period=${period}`
    }
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setAppointments(data.appointments)
      setApptSummary(data.summary)
    }
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault()
    setApptLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptForm),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Erro ao criar agendamento')
        return
      }
      setApptForm({ clientName: '', service: '', value: '', date: '', notes: '' })
      setShowApptForm(false)
      await loadAppointments()
    } finally {
      setApptLoading(false)
    }
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

  const customLabel = isCustom
    ? `${new Date(customSince + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${new Date(customUntil + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : ''

  const PERIOD_LABELS: Record<string, string> = {
    today: 'hoje',
    yesterday: 'ontem',
    last_7d: 'últimos 7 dias',
    last_30d: 'últimos 30 dias',
    this_month: 'este mês',
    last_month: 'mês passado',
    last_90d: 'últimos 90 dias',
    custom: customLabel || 'personalizado',
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
  // ROI = (Ganho - Investimento) / Investimento × 100
  const roi = investido > 0 ? ((faturado - investido) / investido) * 100 : 0

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
              <button key={p.value} onClick={() => {
                if (p.value === 'custom') {
                  setShowDatePicker(v => !v)
                  setPeriod('custom')
                } else {
                  setPeriod(p.value)
                  setShowDatePicker(false)
                }
              }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-400 text-white shadow-sm shadow-blue-400/30'
                    : 'bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                {p.value === 'custom' && isCustom ? customLabel : p.label}
              </button>
            ))}
          </div>
          <button onClick={loadMetrics} disabled={loading}
            className="flex-shrink-0 p-2 rounded-xl bg-blue-400 text-white disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Date picker personalizado */}
      {showDatePicker && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-gray-700 p-4 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-blue-400" />
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Período personalizado</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Data inicial</label>
              <input type="date" value={customSince}
                onChange={e => setCustomSince(e.target.value)}
                max={customUntil || undefined}
                className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-gray-600 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Data final</label>
              <input type="date" value={customUntil}
                onChange={e => setCustomUntil(e.target.value)}
                min={customSince || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-gray-600 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button
              onClick={() => { if (customSince && customUntil) setShowDatePicker(false) }}
              disabled={!customSince || !customUntil}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">
              Aplicar
            </button>
          </div>
          {customSince && customUntil && (
            <p className="text-[10px] text-gray-400 mt-2">
              Mostrando dados de {new Date(customSince + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(customUntil + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}

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

          {/* ═══ FUNIL DE CONVERSÃO ═══ */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                Funil de conversão
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Do anúncio até o faturamento</p>
            </div>

            {/* Funil visual */}
            <div className="px-5 py-5">
              {(() => {
                const alcance = metrics.reach
                const cliques = metrics.clicks
                const conversas = metrics.conversationsStarted ?? 0
                const agendamentos = apptSummary?.total ?? 0
                const realizados = apptSummary?.completed ?? 0
                const faturadoVal = apptSummary?.completedValue ?? 0

                const steps = [
                  { label: 'Alcance', value: alcance, fmt: fmt.number(alcance), color: 'bg-blue-400', lightBg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Cliques', value: cliques, fmt: fmt.number(cliques), color: 'bg-indigo-400', lightBg: 'bg-indigo-50 dark:bg-indigo-900/20', textColor: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Conversas', value: conversas, fmt: fmt.number(conversas), color: 'bg-violet-400', lightBg: 'bg-violet-50 dark:bg-violet-900/20', textColor: 'text-violet-600 dark:text-violet-400' },
                  { label: 'Agendamentos', value: agendamentos, fmt: fmt.number(agendamentos), color: 'bg-amber-400', lightBg: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Realizados', value: realizados, fmt: fmt.number(realizados), color: 'bg-green-500', lightBg: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
                ]

                const maxVal = Math.max(...steps.map(s => s.value), 1)

                return (
                  <div className="space-y-2.5">
                    {steps.map((step, i) => {
                      const widthPct = Math.max((step.value / maxVal) * 100, 8)
                      const prevValue = i > 0 ? steps[i - 1].value : 0
                      const convRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null

                      return (
                        <div key={step.label}>
                          {/* Taxa entre etapas */}
                          {convRate && (
                            <div className="flex items-center gap-2 mb-1 ml-2">
                              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                              <span className="text-[10px] text-gray-400 font-medium">
                                {convRate}% converteram
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right shrink-0">
                              <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{step.label}</p>
                            </div>
                            <div className="flex-1 relative">
                              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                <div
                                  className={`h-full ${step.color} rounded-lg flex items-center transition-all duration-700`}
                                  style={{ width: `${widthPct}%` }}
                                >
                                  <span className="text-white text-xs font-bold ml-3 whitespace-nowrap drop-shadow-sm">
                                    {step.fmt}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Valor por agendamento + faturamento */}
            {apptSummary && apptSummary.total > 0 && (
              <div className="px-5 pb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Custo por agendamento</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {apptSummary.total > 0 ? fmt.currency(investido / apptSummary.total) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Ticket médio</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {apptSummary.completed > 0 ? fmt.currency(apptSummary.completedValue / apptSummary.completed) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Total faturado</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmt.currency(faturado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Lucro líquido</p>
                      <p className={`text-lg font-bold ${lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {lucro >= 0 ? '+' : ''}{fmt.currency(lucro)}
                      </p>
                    </div>
                  </div>

                  {/* Detalhamento por agendamento realizado */}
                  {apptSummary.completed > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                      <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400 mb-2">Agendamentos realizados</p>
                      <div className="space-y-1.5">
                        {appointments.filter(a => a.status === 'completed').slice(0, 8).map(a => (
                          <div key={a.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 truncate">{a.clientName}</span>
                              {a.service && <span className="text-gray-400 truncate hidden sm:inline">· {a.service}</span>}
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400 shrink-0 ml-2">{fmt.currency(a.value)}</span>
                          </div>
                        ))}
                        {appointments.filter(a => a.status === 'completed').length > 8 && (
                          <p className="text-[10px] text-gray-400 text-center mt-1">
                            +{appointments.filter(a => a.status === 'completed').length - 8} realizados
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ AGENDAMENTOS ═══ */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white">Agendamentos — {PERIOD_LABELS[period] ?? 'período selecionado'}</h2>
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
