'use client'

import { useEffect, useState } from 'react'
import { Zap, ShoppingCart, Users, DollarSign, RefreshCw, Eye, CreditCard, UserCheck, Search, Star } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from 'next-themes'

interface PixelData {
  pixelFires: number; pixelPurchases: number; pixelLeads: number
  pixelAddToCart: number; pixelInitiateCheckout: number
  pixelCompleteRegistration: number; pixelViewContent: number
  pixelSearches: number; pixelCustomEvents: number
  spend: number; roas: number; purchaseValue: number
}

export default function PixelPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState<PixelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [period, setPeriod] = useState('last_30d')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(c => { setClients(c); if (c.length > 0) setClientId(c[0].id) })
  }, [])
  useEffect(() => { if (clientId) load() }, [clientId, period])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta/metrics?clientId=${clientId}&datePreset=${period}`)
      const json = await res.json()
      const m = json.metrics
      setData({
        pixelFires: m.pixelFires, pixelPurchases: m.pixelPurchases, pixelLeads: m.pixelLeads,
        pixelAddToCart: m.pixelAddToCart, pixelInitiateCheckout: m.pixelInitiateCheckout,
        pixelCompleteRegistration: m.pixelCompleteRegistration, pixelViewContent: m.pixelViewContent,
        pixelSearches: m.pixelSearches, pixelCustomEvents: m.pixelCustomEvents,
        spend: m.spend, roas: m.roas, purchaseValue: m.purchaseValue,
      })
    } finally { setLoading(false) }
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
  }

  const funnelData = data ? [
    { stage: 'Visualizaram', value: data.pixelViewContent,          color: '#93c5fd' },
    { stage: 'Pesquisaram',  value: data.pixelSearches,             color: '#60a5fa' },
    { stage: 'Carrinho',     value: data.pixelAddToCart,            color: '#3b82f6' },
    { stage: 'Checkout',     value: data.pixelInitiateCheckout,     color: '#2563eb' },
    { stage: 'Compraram',    value: data.pixelPurchases,            color: '#1d4ed8' },
  ] : []

  const grid = isDark ? '#1f2937' : '#f0f7ff'
  const text = isDark ? '#6b7280' : '#9ca3af'
  const tipBg = isDark ? '#111827' : '#ffffff'
  const tipBorder = isDark ? '#1f2937' : '#bfdbfe'

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={22} className="text-blue-400" /> Pixel & Conversões
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Rastreamento de eventos no seu site</p>
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
          </select>
          <button onClick={load} disabled={loading} className="p-2 bg-blue-400 text-white rounded-xl">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* O que é o Pixel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">⚡ O que é o Pixel?</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
          O Pixel da Meta é um código instalado no seu site que rastreia o que as pessoas fazem depois de clicar no seu anúncio.
          Ele registra quem visualizou produtos, adicionou ao carrinho, iniciou o pagamento e quem efetivamente comprou.
        </p>
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}

      {data && !loading && (
        <>
          {/* Resumo financeiro */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <MetricCard title="Receita gerada" value={fmt.currency(data.purchaseValue)} icon={DollarSign} color="blue" subtitle="Valor total de vendas" />
            <MetricCard title="ROAS" value={`${data.roas.toFixed(2)}x`} icon={Star} color="green" subtitle="Retorno por R$1 investido" />
            <MetricCard title="Compras" value={fmt.number(data.pixelPurchases)} icon={ShoppingCart} color="purple" subtitle="Pedidos concluídos" />
          </div>

          {/* Funil de conversão */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Funil de Compra</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Jornada do cliente desde o anúncio até a compra</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: text, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.toLocaleString('pt-BR')} />
                <YAxis type="category" dataKey="stage" tick={{ fill: text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tipBg, border: `1px solid ${tipBorder}`, borderRadius: 12 }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Eventos']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}
                  fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Eventos individuais */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard title="Visualizações de produto" value={fmt.number(data.pixelViewContent)} icon={Eye} color="blue" subtitle="Ver Conteúdo" />
            <MetricCard title="Leads captados" value={fmt.number(data.pixelLeads)} icon={Users} color="green" subtitle="Formulários preenchidos" />
            <MetricCard title="Adicionaram ao carrinho" value={fmt.number(data.pixelAddToCart)} icon={ShoppingCart} color="purple" subtitle="AddToCart" />
            <MetricCard title="Iniciaram pagamento" value={fmt.number(data.pixelInitiateCheckout)} icon={CreditCard} color="orange" subtitle="InitiateCheckout" />
            <MetricCard title="Cadastros completos" value={fmt.number(data.pixelCompleteRegistration)} icon={UserCheck} color="blue" subtitle="CompleteRegistration" />
            <MetricCard title="Buscas realizadas" value={fmt.number(data.pixelSearches)} icon={Search} color="green" subtitle="Search" />
          </div>
        </>
      )}
    </div>
  )
}
