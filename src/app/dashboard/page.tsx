'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, HelpCircle, DollarSign, MousePointer, Eye, Users, Zap, Activity, Target, BarChart2 } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import SpendChart from '@/components/SpendChart'
import MonthlyComparisonChart from '@/components/MonthlyComparisonChart'
import RoasChart from '@/components/RoasChart'

interface Client { id: string; name: string; adAccountId: string; accessToken: string | null }
interface Metrics {
  spend: number; impressions: number; clicks: number
  cpc: number; cpm: number; ctr: number
  reach: number; frequency: number; conversions: number; roas: number
}
interface MonthlyData {
  month: string; spend: number; clicks: number
  impressions: number; conversions: number; roas: number
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

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(data)
      if (data.length > 0) setSelectedClientId(data[0].id)
    })
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

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
    percent: (v: number) => `${v.toFixed(2)}%`,
    roas: (v: number) => `${v.toFixed(2)}x`,
  }

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
          <a href="/dashboard/clients"
            className="px-6 py-3 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl">
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
          {/* Aviso dados de exemplo */}
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

          {/* Card destaque ROAS */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-5 mb-4 shadow-xl shadow-blue-400/30 text-white">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-blue-100 text-sm font-medium">Retorno do seu investimento</p>
                <p className="text-4xl font-bold mt-1">{fmt.roas(metrics.roas)}</p>
                <p className="text-blue-100 text-sm mt-1">Cada R$1 virou R${metrics.roas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>
            <span className="inline-flex items-center bg-white/20 rounded-xl px-3 py-1.5 text-xs font-medium">
              {metrics.roas >= 1 ? '✅ Anúncios dando retorno' : '⚠️ Invista com cuidado'}
            </span>
          </div>

          {/* Cards principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard title="Quanto investiu"     value={fmt.currency(metrics.spend)}          icon={DollarSign}   color="blue"   subtitle="Total gasto" />
            <MetricCard title="Pessoas clicaram"    value={fmt.number(metrics.clicks)}           icon={MousePointer} color="green"  subtitle={`CTR ${fmt.percent(metrics.ctr)}`} />
            <MetricCard title="Vezes que apareceu"  value={fmt.number(metrics.impressions)}      icon={Eye}          color="purple" subtitle="Total de views" />
            <MetricCard title="Pessoas alcançadas"  value={fmt.number(metrics.reach)}            icon={Users}        color="orange" subtitle={`${metrics.frequency.toFixed(1)}x por pessoa`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MetricCard title="Custo por clique"    value={fmt.currency(metrics.cpc)}            icon={Target}    color="blue"   subtitle="CPC" />
            <MetricCard title="Conversões"          value={fmt.number(metrics.conversions)}      icon={Zap}       color="green"  subtitle="Ações realizadas" />
            <MetricCard title="Custo 1000 views"    value={fmt.currency(metrics.cpm)}            icon={Activity}  color="purple" subtitle="CPM" />
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 flex flex-col justify-center">
              <p className="text-xs text-gray-400 mb-1">Taxa de cliques</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt.percent(metrics.ctr)}</p>
              <p className="text-xs text-gray-400 mt-1">CTR</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SpendChart data={monthly} />
            <MonthlyComparisonChart data={monthly} />
          </div>
          <RoasChart data={monthly} />
        </>
      )}
    </div>
  )
}
