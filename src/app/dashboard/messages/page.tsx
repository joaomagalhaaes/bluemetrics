'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, MessageSquare, Users, DollarSign, RefreshCw, TrendingUp } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from 'next-themes'

interface Data {
  conversationsStarted: number
  costPerConversation: number
  messagingReplies: number
  newMessagingConnections: number
  spend: number
  reach: number
}
interface Monthly { month: string; conversationsStarted: number; leads: number; spend: number }

export default function MessagesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState<Data | null>(null)
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [period, setPeriod] = useState('last_30d')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(c => {
      setClients(c)
      if (c.length > 0) setClientId(c[0].id)
    })
  }, [])

  useEffect(() => { if (clientId) load() }, [clientId, period])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta/metrics?clientId=${clientId}&datePreset=${period}`)
      const json = await res.json()
      const m = json.metrics
      setData({
        conversationsStarted: m.conversationsStarted,
        costPerConversation: m.costPerConversation,
        messagingReplies: m.messagingReplies,
        newMessagingConnections: m.newMessagingConnections,
        spend: m.spend,
        reach: m.reach,
      })
      setMonthly(json.monthly)
    } finally { setLoading(false) }
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
  }

  const grid = isDark ? '#1f2937' : '#f0f7ff'
  const text = isDark ? '#6b7280' : '#9ca3af'
  const tipBg = isDark ? '#111827' : '#ffffff'
  const tipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const convRate = data && data.reach > 0 ? ((data.conversationsStarted / data.reach) * 100).toFixed(2) : '0.00'

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={22} className="text-blue-400" /> Conversas & WhatsApp
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Métricas de mensagens e conversas iniciadas</p>
        </div>
        <div className="flex items-center gap-2">
          {clients.length > 1 && (
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="today">Hoje</option>
            <option value="last_7d">7 dias</option>
            <option value="last_30d">30 dias</option>
            <option value="this_month">Este mês</option>
            <option value="last_month">Mês passado</option>
          </select>
          <button onClick={load} disabled={loading} className="p-2 bg-blue-400 text-white rounded-xl">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}

      {data && !loading && (
        <>
          {/* Explicação */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-5">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💬 O que são "conversas iniciadas"?</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              É quando alguém clicou no seu anúncio e <strong>enviou uma mensagem</strong> para o seu WhatsApp ou Messenger.
              Diferente de "conversões", isso mede contatos diretos — a venda acontece fora da plataforma, no seu atendimento.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricCard title="Conversas iniciadas" value={fmt.number(data.conversationsStarted)} icon={MessageCircle} color="blue" subtitle="WhatsApp + Messenger" />
            <MetricCard title="Custo por conversa" value={fmt.currency(data.costPerConversation)} icon={DollarSign} color="green" subtitle="Quanto custou cada contato" />
            <MetricCard title="Respostas recebidas" value={fmt.number(data.messagingReplies)} icon={MessageSquare} color="purple" subtitle="Pessoas que responderam" />
            <MetricCard title="Novos contatos" value={fmt.number(data.newMessagingConnections)} icon={Users} color="orange" subtitle="Primeira mensagem com você" />
          </div>

          {/* Taxa de conversação */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-5 flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-400/30">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de conversação</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{convRate}%</p>
              <p className="text-xs text-gray-400 mt-0.5">
                De {fmt.number(data.reach)} pessoas alcançadas, {fmt.number(data.conversationsStarted)} iniciaram conversa
              </p>
            </div>
          </div>

          {/* Gráfico de barras mensais */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Conversas por mês</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Evolução de conversas iniciadas nos últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fill: text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ backgroundColor: tipBg, border: `1px solid ${tipBorder}`, borderRadius: 12 }}
                  labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Conversas']} />
                <Bar dataKey="conversationsStarted" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {monthly.map((_, i) => (
                    <Cell key={i} fill={i === monthly.length - 1 ? '#60a5fa' : isDark ? '#1e3a5f' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!data && !loading && clientId === '' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle size={40} className="text-blue-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Adicione uma conta para ver as métricas de conversas.</p>
        </div>
      )}
    </div>
  )
}
