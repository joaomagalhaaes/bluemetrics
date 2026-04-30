'use client'

import { useEffect, useState } from 'react'
import {
  LayoutGrid, ChevronRight, ArrowLeft, ChevronDown,
  Eye, MousePointerClick, DollarSign, Users, MessageCircle,
  Target, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Pause, Play, Layers, Megaphone, Image
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

function fmt(n: number)  { return n.toLocaleString('pt-BR') }
function money(n: number){ return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function pct(n: number)  { return n.toFixed(2).replace('.', ',') + '%' }

const DATE_OPTIONS = [
  { value: 'today',       label: 'Hoje' },
  { value: 'yesterday',   label: 'Ontem' },
  { value: 'last_7d',     label: 'Últimos 7 dias' },
  { value: 'last_14d',    label: '14 dias' },
  { value: 'last_30d',    label: '30 dias' },
  { value: 'this_month',  label: 'Este mês' },
  { value: 'last_month',  label: 'Mês passado' },
]

function objectiveLabel(obj: string) {
  const map: Record<string, string> = {
    'CONVERSIONS': 'Vendas',
    'MESSAGES': 'Mensagens',
    'LEAD_GENERATION': 'Geração de Leads',
    'LINK_CLICKS': 'Tráfego',
    'REACH': 'Alcance',
    'BRAND_AWARENESS': 'Reconhecimento',
    'VIDEO_VIEWS': 'Vídeos',
    'ENGAGEMENT': 'Engajamento',
    'APP_INSTALLS': 'Instalações',
    'OUTCOME_TRAFFIC': 'Tráfego',
    'OUTCOME_LEADS': 'Leads',
    'OUTCOME_SALES': 'Vendas',
    'OUTCOME_AWARENESS': 'Reconhecimento',
    'OUTCOME_ENGAGEMENT': 'Engajamento',
  }
  return map[obj] ?? 'Campanha'
}

/* ─────────────────────────────────────────────────
   RESUMO GERAL NO TOPO
   ───────────────────────────────────────────────── */
function TopSummary({ m }: { m: Metrics }) {
  const cards = [
    { label: 'Investimento total',    value: money(m.investimento),           icon: DollarSign,       color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Resultados',            value: fmt(m.resultados),               icon: Target,           color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Custo por resultado',   value: money(m.custoPorResultado),      icon: TrendingDown,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pessoas alcançadas',    value: fmt(m.pessoasAlcancadas),        icon: Users,            color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Conversas no WhatsApp', value: fmt(m.conversasIniciadas),       icon: MessageCircle,    color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Cliques',               value: fmt(m.cliques),                  icon: MousePointerClick,color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-4 border border-transparent`}>
          <div className="flex items-center gap-2 mb-2">
            <c.icon size={16} className={c.color} />
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{c.label}</span>
          </div>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   CARD DE CAMPANHA — visual e claro
   ───────────────────────────────────────────────── */
function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const m = campaign.metrics
  const active = campaign.status === 'ACTIVE'

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      {/* Cabeçalho */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-3 h-3 rounded-full shrink-0 ${active ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                active
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {active ? 'Ativa' : 'Pausada'}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {objectiveLabel(campaign.objective)}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                · {campaign.adsets.length} conjunto{campaign.adsets.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
      </div>

      {/* Métricas */}
      {m ? (
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-0.5">Investimento</p>
            <p className="text-base font-bold text-gray-800 dark:text-white">{money(m.investimento)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-0.5">Resultados</p>
            <p className="text-base font-bold text-green-500">{fmt(m.resultados)}</p>
            <p className="text-[10px] text-gray-400">{money(m.custoPorResultado)} cada</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-0.5">Pessoas alcançadas</p>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">{fmt(m.pessoasAlcancadas)}</p>
            <p className="text-[10px] text-gray-400">{fmt(m.cliques)} cliques</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-0.5">Conversas</p>
            <p className="text-base font-bold text-blue-500">{fmt(m.conversasIniciadas)}</p>
            {m.custoPorConversa > 0 && <p className="text-[10px] text-gray-400">{money(m.custoPorConversa)} cada</p>}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 text-sm text-gray-400">Sem dados no período</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   CARD DE CONJUNTO DE ANÚNCIOS
   ───────────────────────────────────────────────── */
function AdSetCard({ adset, onClick }: { adset: AdSet; onClick: () => void }) {
  const m = adset.metrics
  const active = adset.status === 'ACTIVE'

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 min-w-0">
          <Layers size={16} className="text-blue-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
              {adset.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                       : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {active ? 'Ativo' : 'Pausado'}
              </span>
              <span className="text-[10px] text-gray-400">
                {adset.ads.length} anúncio{adset.ads.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
      </div>

      {m ? (
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Investimento</p>
            <p className="text-base font-bold text-gray-800 dark:text-white">{money(m.investimento)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Resultados</p>
            <p className="text-base font-bold text-green-500">{fmt(m.resultados)}</p>
            <p className="text-[10px] text-gray-400">{money(m.custoPorResultado)} cada</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Pessoas alcançadas</p>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">{fmt(m.pessoasAlcancadas)}</p>
            <p className="text-[10px] text-gray-400">{fmt(m.cliques)} cliques</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Conversas</p>
            <p className="text-base font-bold text-blue-500">{fmt(m.conversasIniciadas)}</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 text-sm text-gray-400">Sem dados no período</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   CARD DE ANÚNCIO INDIVIDUAL
   ───────────────────────────────────────────────── */
function AdCard({ ad }: { ad: Ad }) {
  const m = ad.metrics
  const active = ad.status === 'ACTIVE'
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Cabeçalho */}
      <div
        onClick={() => setOpen(!open)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Image size={16} className="text-purple-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{ad.name}</h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                     : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {active ? 'Ativo' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Mini resumo (quando fechado) */}
        {!open && m && (
          <div className="hidden md:flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400 mr-2">
            <span><strong className="text-gray-800 dark:text-white">{money(m.investimento)}</strong> gasto</span>
            <span><strong className="text-green-500">{fmt(m.resultados)}</strong> resultados</span>
            <span><strong className="text-blue-500">{fmt(m.conversasIniciadas)}</strong> conversas</span>
          </div>
        )}

        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Detalhes expandidos */}
      {open && m && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricItem label="Investimento"           value={money(m.investimento)}       />
            <MetricItem label="Resultados"             value={fmt(m.resultados)}            color="text-green-500" />
            <MetricItem label="Custo por resultado"    value={money(m.custoPorResultado)}  />
            <MetricItem label="Pessoas que viram"      value={fmt(m.pessoasAlcancadas)}    />
            <MetricItem label="Cliques no anúncio"     value={fmt(m.cliques)}              />
            <MetricItem label="Taxa de cliques"        value={pct(m.taxaDeCliques)}        />
            <MetricItem label="Conversas no WhatsApp"  value={fmt(m.conversasIniciadas)}    color="text-blue-500" />
            <MetricItem label="Custo por conversa"     value={money(m.custoPorConversa)}   />
            <MetricItem label="Custo por clique"       value={money(m.custoPorClique)}     />
            <MetricItem label="Vezes que o anúncio apareceu" value={fmt(m.visualizacoes)}  />
            <MetricItem label="Cada pessoa viu em média"     value={m.frequencia.toFixed(1) + 'x'} />
            <MetricItem label="Compras"                value={fmt(m.compras)}               color="text-purple-500" />
          </div>
        </div>
      )}

      {open && !m && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4 text-sm text-gray-400">
          Sem dados no período selecionado
        </div>
      )}
    </div>
  )
}

function MetricItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color ?? 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   PÁGINA PRINCIPAL
   ───────────────────────────────────────────────── */
export default function GerenciadorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [demo, setDemo]           = useState(false)
  const [datePreset, setDatePreset] = useState('last_30d')

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

  // Somar métricas
  function sumMetrics(items: { metrics: Metrics | null }[]): Metrics | null {
    const valid = items.filter(i => i.metrics) as { metrics: Metrics }[]
    if (valid.length === 0) return null
    const sum: Metrics = {
      pessoasAlcancadas: valid.reduce((s, i) => s + i.metrics.pessoasAlcancadas, 0),
      visualizacoes: valid.reduce((s, i) => s + i.metrics.visualizacoes, 0),
      cliques: valid.reduce((s, i) => s + i.metrics.cliques, 0),
      cliquesNoLink: valid.reduce((s, i) => s + i.metrics.cliquesNoLink, 0),
      taxaDeCliques: 0, custoPorClique: 0, custoPorMilVisualizacoes: 0,
      investimento: valid.reduce((s, i) => s + i.metrics.investimento, 0),
      frequencia: 0,
      resultados: valid.reduce((s, i) => s + i.metrics.resultados, 0),
      custoPorResultado: 0,
      conversasIniciadas: valid.reduce((s, i) => s + i.metrics.conversasIniciadas, 0),
      custoPorConversa: 0,
      leads: valid.reduce((s, i) => s + i.metrics.leads, 0),
      compras: valid.reduce((s, i) => s + i.metrics.compras, 0),
    }
    sum.taxaDeCliques = sum.visualizacoes > 0 ? (sum.cliques / sum.visualizacoes) * 100 : 0
    sum.custoPorClique = sum.cliques > 0 ? sum.investimento / sum.cliques : 0
    sum.custoPorMilVisualizacoes = sum.visualizacoes > 0 ? (sum.investimento / sum.visualizacoes) * 1000 : 0
    sum.custoPorResultado = sum.resultados > 0 ? sum.investimento / sum.resultados : 0
    sum.custoPorConversa = sum.conversasIniciadas > 0 ? sum.investimento / sum.conversasIniciadas : 0
    sum.frequencia = sum.pessoasAlcancadas > 0 ? sum.visualizacoes / sum.pessoasAlcancadas : 0
    return sum
  }

  const totalMetrics = selectedAdSet
    ? selectedAdSet.metrics
    : selectedCampaign
      ? selectedCampaign.metrics
      : sumMetrics(campaigns)

  // Contagens para header
  const totalActive = campaigns.filter(c => c.status === 'ACTIVE').length
  const totalPaused = campaigns.filter(c => c.status !== 'ACTIVE').length

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {(selectedCampaign || selectedAdSet) && (
            <button
              onClick={() => selectedAdSet ? setSelectedAdSet(null) : setSelectedCampaign(null)}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <LayoutGrid size={22} className="text-blue-400" />
              Gerenciador de Anúncios
            </h1>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 dark:text-gray-500">
              <button
                onClick={() => { setSelectedCampaign(null); setSelectedAdSet(null) }}
                className={`hover:text-blue-500 transition-colors ${!selectedCampaign ? 'text-blue-500 font-medium' : ''}`}
              >
                Campanhas
              </button>
              {selectedCampaign && (
                <>
                  <ChevronRight size={10} />
                  <button
                    onClick={() => setSelectedAdSet(null)}
                    className={`hover:text-blue-500 transition-colors truncate max-w-[180px] ${!selectedAdSet ? 'text-blue-500 font-medium' : ''}`}
                  >
                    {selectedCampaign.name}
                  </button>
                </>
              )}
              {selectedAdSet && (
                <>
                  <ChevronRight size={10} />
                  <span className="text-blue-500 font-medium truncate max-w-[180px]">{selectedAdSet.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Período */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Período:</span>
          <div className="flex flex-wrap gap-1">
            {DATE_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setDatePreset(o.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  datePreset === o.value
                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo */}
      {demo && (
        <div className="mb-5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Dados de demonstração</p>
            <p className="text-xs mt-0.5 opacity-80">Conecte sua conta Meta em <strong>Configurações</strong> para ver os dados reais das suas campanhas.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-blue-400" />
          <p className="text-sm">Carregando campanhas...</p>
        </div>
      ) : (
        <>
          {/* ── RESUMO GERAL ── */}
          {totalMetrics && <TopSummary m={totalMetrics} />}

          {/* ── INFO DA VISÃO ATUAL ── */}
          {!selectedCampaign && (
            <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" /> {totalActive} ativa{totalActive !== 1 ? 's' : ''}
              </span>
              {totalPaused > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" /> {totalPaused} pausada{totalPaused !== 1 ? 's' : ''}
                </span>
              )}
              <span>· {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} no total</span>
            </div>
          )}

          {/* ── LISTA DE CAMPANHAS ── */}
          {!selectedCampaign && !selectedAdSet && (
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Megaphone size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma campanha encontrada</p>
                  <p className="text-xs text-gray-400 mt-1">Conecte sua conta Meta para ver suas campanhas</p>
                </div>
              ) : (
                campaigns.map(camp => (
                  <CampaignCard key={camp.id} campaign={camp} onClick={() => setSelectedCampaign(camp)} />
                ))
              )}
            </div>
          )}

          {/* ── CONJUNTOS DE ANÚNCIOS ── */}
          {selectedCampaign && !selectedAdSet && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {selectedCampaign.adsets.length} conjunto{selectedCampaign.adsets.length !== 1 ? 's' : ''} de anúncios
              </p>
              {selectedCampaign.adsets.map(adset => (
                <AdSetCard key={adset.id} adset={adset} onClick={() => setSelectedAdSet(adset)} />
              ))}
            </div>
          )}

          {/* ── ANÚNCIOS INDIVIDUAIS ── */}
          {selectedAdSet && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {selectedAdSet.ads.length} anúncio{selectedAdSet.ads.length !== 1 ? 's' : ''}
              </p>
              {selectedAdSet.ads.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}

          {/* ── LEGENDA ── */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">Entenda as métricas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Pessoas alcançadas</strong> — quantas pessoas diferentes viram seu anúncio</p>
              <p><strong>Resultados</strong> — leads, vendas ou conversas geradas</p>
              <p><strong>Conversas no WhatsApp</strong> — quantas pessoas mandaram mensagem</p>
              <p><strong>Custo por resultado</strong> — quanto custou cada cliente potencial</p>
              <p><strong>Taxa de cliques</strong> — de cada 100 pessoas que viram, quantas clicaram</p>
              <p><strong>Frequência</strong> — quantas vezes cada pessoa viu o anúncio</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
