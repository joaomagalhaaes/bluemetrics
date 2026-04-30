'use client'

import { useEffect, useState } from 'react'
import {
  LayoutGrid, ChevronRight, ChevronDown, ArrowLeft,
  Eye, MousePointerClick, DollarSign, Users, MessageCircle,
  Target, ShoppingCart, BarChart2, Loader2, AlertTriangle,
  Pause, Play, TrendingUp
} from 'lucide-react'

interface Metrics {
  pessoasAlcancadas: number
  visualizacoes: number
  cliques: number
  cliquesNoLink: number
  taxaDeCliques: number
  custoPorClique: number
  custoPorMilVisualizacoes: number
  investimento: number
  frequencia: number
  resultados: number
  custoPorResultado: number
  conversasIniciadas: number
  custoPorConversa: number
  leads: number
  compras: number
}

interface Ad       { id: string; name: string; status: string; metrics: Metrics | null }
interface AdSet    { id: string; name: string; status: string; metrics: Metrics | null; ads: Ad[] }
interface Campaign { id: string; name: string; status: string; objective: string; metrics: Metrics | null; adsets: AdSet[] }

type ViewLevel = 'campaigns' | 'adsets' | 'ads'

function fmt(n: number)  { return n.toLocaleString('pt-BR') }
function money(n: number){ return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function pct(n: number)  { return n.toFixed(2).replace('.', ',') + '%' }

function StatusBadge({ status }: { status: string }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      active
        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {active ? <Play size={8} /> : <Pause size={8} />}
      {active ? 'Ativo' : 'Pausado'}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={12} className="text-white" />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  )
}

function MetricsOverview({ m }: { m: Metrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      <MetricCard icon={Users}            label="Pessoas alcançadas"     value={fmt(m.pessoasAlcancadas)} sub={`Viram ${fmt(m.visualizacoes)}x (freq. ${m.frequencia.toFixed(1)})`} color="bg-blue-500" />
      <MetricCard icon={MousePointerClick} label="Cliques no anúncio"   value={fmt(m.cliques)} sub={`Taxa de cliques: ${pct(m.taxaDeCliques)}`} color="bg-purple-500" />
      <MetricCard icon={Target}           label="Resultados"             value={fmt(m.resultados)} sub={`Custo por resultado: ${money(m.custoPorResultado)}`} color="bg-green-500" />
      <MetricCard icon={DollarSign}       label="Investimento"           value={money(m.investimento)} sub={`CPC: ${money(m.custoPorClique)}`} color="bg-amber-500" />
    </div>
  )
}

// Tabela de métricas detalhadas
function MetricsTable({ items, onSelect, level }: {
  items: { id: string; name: string; status: string; metrics: Metrics | null; hasChildren?: boolean }[]
  onSelect?: (id: string) => void
  level: ViewLevel
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header da tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 min-w-[200px] sticky left-0 bg-gray-50 dark:bg-gray-900/50">
                {level === 'campaigns' ? 'Campanha' : level === 'adsets' ? 'Conjunto de anúncios' : 'Anúncio'}
              </th>
              <th className="text-left px-3 py-3 font-semibold text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Quantas pessoas diferentes viram seu anúncio">Pessoas que viram</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Total de vezes que o anúncio apareceu">Vezes exibido</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Quantas vezes clicaram no anúncio">Cliques</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Porcentagem de pessoas que clicaram">Taxa de cliques</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Leads, conversas ou vendas geradas">Resultados</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Conversas iniciadas via WhatsApp/Messenger">Conversas</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Quanto foi gasto">Investimento</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Quanto custa cada clique">Custo/clique</span>
              </th>
              <th className="text-right px-3 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span title="Quanto custa cada resultado">Custo/resultado</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const m = item.metrics
              const isOpen = expanded === item.id
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                    item.hasChildren ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (item.hasChildren && onSelect) onSelect(item.id)
                  }}
                >
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      {item.hasChildren && (
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      )}
                      <span className="font-medium text-gray-800 dark:text-white truncate max-w-[180px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{m ? fmt(m.pessoasAlcancadas) : '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{m ? fmt(m.visualizacoes) : '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{m ? fmt(m.cliques) : '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{m ? pct(m.taxaDeCliques) : '—'}</td>
                  <td className="px-3 py-3 text-right font-semibold text-green-600 dark:text-green-400">{m ? fmt(m.resultados) : '—'}</td>
                  <td className="px-3 py-3 text-right text-blue-600 dark:text-blue-400">{m ? fmt(m.conversasIniciadas) : '—'}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-800 dark:text-white">{m ? money(m.investimento) : '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{m ? money(m.custoPorClique) : '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{m ? money(m.custoPorResultado) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">Nenhum dado encontrado</div>
      )}
    </div>
  )
}

const DATE_OPTIONS = [
  { value: 'today',       label: 'Hoje' },
  { value: 'yesterday',   label: 'Ontem' },
  { value: 'last_7d',     label: 'Últimos 7 dias' },
  { value: 'last_14d',    label: 'Últimos 14 dias' },
  { value: 'last_30d',    label: 'Últimos 30 dias' },
  { value: 'this_month',  label: 'Este mês' },
  { value: 'last_month',  label: 'Mês passado' },
]

export default function GerenciadorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [demo, setDemo]           = useState(false)
  const [datePreset, setDatePreset] = useState('last_30d')

  // Navegação: campanha → adset → ad
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [selectedAdSet, setSelectedAdSet]       = useState<AdSet | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/meta/campaigns?datePreset=${datePreset}`)
      .then(r => r.json())
      .then(data => {
        setCampaigns(data.campaigns ?? [])
        setDemo(data.demo ?? false)
        setSelectedCampaign(null)
        setSelectedAdSet(null)
      })
      .finally(() => setLoading(false))
  }, [datePreset])

  // Totais
  function sumMetrics(items: { metrics: Metrics | null }[]): Metrics | null {
    const withMetrics = items.filter(i => i.metrics) as { metrics: Metrics }[]
    if (withMetrics.length === 0) return null
    return {
      pessoasAlcancadas: withMetrics.reduce((s, i) => s + i.metrics.pessoasAlcancadas, 0),
      visualizacoes: withMetrics.reduce((s, i) => s + i.metrics.visualizacoes, 0),
      cliques: withMetrics.reduce((s, i) => s + i.metrics.cliques, 0),
      cliquesNoLink: withMetrics.reduce((s, i) => s + i.metrics.cliquesNoLink, 0),
      taxaDeCliques: 0,
      custoPorClique: 0,
      custoPorMilVisualizacoes: 0,
      investimento: withMetrics.reduce((s, i) => s + i.metrics.investimento, 0),
      frequencia: 0,
      resultados: withMetrics.reduce((s, i) => s + i.metrics.resultados, 0),
      custoPorResultado: 0,
      conversasIniciadas: withMetrics.reduce((s, i) => s + i.metrics.conversasIniciadas, 0),
      custoPorConversa: 0,
      leads: withMetrics.reduce((s, i) => s + i.metrics.leads, 0),
      compras: withMetrics.reduce((s, i) => s + i.metrics.compras, 0),
    }
  }

  function computeRates(m: Metrics): Metrics {
    return {
      ...m,
      taxaDeCliques: m.visualizacoes > 0 ? (m.cliques / m.visualizacoes) * 100 : 0,
      custoPorClique: m.cliques > 0 ? m.investimento / m.cliques : 0,
      custoPorMilVisualizacoes: m.visualizacoes > 0 ? (m.investimento / m.visualizacoes) * 1000 : 0,
      custoPorResultado: m.resultados > 0 ? m.investimento / m.resultados : 0,
      custoPorConversa: m.conversasIniciadas > 0 ? m.investimento / m.conversasIniciadas : 0,
      frequencia: m.pessoasAlcancadas > 0 ? m.visualizacoes / m.pessoasAlcancadas : 0,
    }
  }

  // Visão atual
  let currentLevel: ViewLevel = 'campaigns'
  let currentTitle = 'Todas as campanhas'
  let currentItems: { id: string; name: string; status: string; metrics: Metrics | null; hasChildren?: boolean }[] = []
  let totalMetrics: Metrics | null = null

  if (selectedAdSet) {
    currentLevel = 'ads'
    currentTitle = selectedAdSet.name
    currentItems = selectedAdSet.ads.map(a => ({ ...a, hasChildren: false }))
    totalMetrics = selectedAdSet.metrics
  } else if (selectedCampaign) {
    currentLevel = 'adsets'
    currentTitle = selectedCampaign.name
    currentItems = selectedCampaign.adsets.map(as => ({ ...as, hasChildren: true }))
    totalMetrics = selectedCampaign.metrics
  } else {
    currentLevel = 'campaigns'
    currentTitle = 'Todas as campanhas'
    currentItems = campaigns.map(c => ({ ...c, hasChildren: true }))
    const raw = sumMetrics(campaigns)
    totalMetrics = raw ? computeRates(raw) : null
  }

  function handleSelect(id: string) {
    if (currentLevel === 'campaigns') {
      const camp = campaigns.find(c => c.id === id)
      if (camp) setSelectedCampaign(camp)
    } else if (currentLevel === 'adsets') {
      const adset = selectedCampaign?.adsets.find(as => as.id === id)
      if (adset) setSelectedAdSet(adset)
    }
  }

  function goBack() {
    if (selectedAdSet) {
      setSelectedAdSet(null)
    } else if (selectedCampaign) {
      setSelectedCampaign(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {(selectedCampaign || selectedAdSet) && (
            <button onClick={goBack} className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <LayoutGrid size={24} className="text-blue-400" />
              Gerenciador
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <button onClick={() => { setSelectedCampaign(null); setSelectedAdSet(null) }}
                className="hover:text-blue-500 transition-colors">
                Campanhas
              </button>
              {selectedCampaign && (
                <>
                  <ChevronRight size={12} />
                  <button onClick={() => setSelectedAdSet(null)}
                    className="hover:text-blue-500 transition-colors truncate max-w-[150px]">
                    {selectedCampaign.name}
                  </button>
                </>
              )}
              {selectedAdSet && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-blue-400 truncate max-w-[150px]">{selectedAdSet.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <select
          value={datePreset}
          onChange={e => setDatePreset(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {DATE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Demo banner */}
      {demo && (
        <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} />
          <span>Mostrando dados de demonstração. Conecte sua conta Meta em <strong>Configurações</strong> para ver dados reais.</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Carregando campanhas...</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          {totalMetrics && <MetricsOverview m={totalMetrics} />}

          {/* Cards extra */}
          {totalMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Conversas iniciadas</p>
                <p className="text-base font-bold text-blue-500">{fmt(totalMetrics.conversasIniciadas)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Custo por conversa</p>
                <p className="text-base font-bold text-blue-500">{money(totalMetrics.custoPorConversa)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Leads gerados</p>
                <p className="text-base font-bold text-green-500">{fmt(totalMetrics.leads)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Compras</p>
                <p className="text-base font-bold text-purple-500">{fmt(totalMetrics.compras)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Custo por mil exibições</p>
                <p className="text-base font-bold text-amber-500">{money(totalMetrics.custoPorMilVisualizacoes)}</p>
              </div>
            </div>
          )}

          {/* Tabela */}
          <MetricsTable
            items={currentItems}
            onSelect={handleSelect}
            level={currentLevel}
          />

          {/* Legenda */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">O que significa cada métrica?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Pessoas que viram</strong> — quantas pessoas diferentes viram o anúncio</p>
              <p><strong>Vezes exibido</strong> — quantas vezes o anúncio apareceu no total</p>
              <p><strong>Cliques</strong> — quantas vezes clicaram no anúncio</p>
              <p><strong>Taxa de cliques</strong> — porcentagem que clicou (cliques ÷ exibições)</p>
              <p><strong>Resultados</strong> — leads, vendas ou conversas geradas pelo anúncio</p>
              <p><strong>Conversas</strong> — pessoas que iniciaram conversa no WhatsApp/Messenger</p>
              <p><strong>Investimento</strong> — valor total gasto no anúncio</p>
              <p><strong>Custo/clique</strong> — quanto custou cada clique em média</p>
              <p><strong>Custo/resultado</strong> — quanto custou cada lead/venda gerada</p>
              <p><strong>Custo por mil exibições</strong> — custo a cada 1.000 vezes que o anúncio apareceu</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
