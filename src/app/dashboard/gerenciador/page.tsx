'use client'

import { useEffect, useState } from 'react'
import {
  LayoutGrid, ChevronRight, ArrowLeft, ChevronDown,
  MousePointerClick, DollarSign, Users, MessageCircle,
  Target, Loader2, AlertTriangle, Layers, Megaphone,
  Image, Eye, ShoppingCart, UserPlus, BarChart3
} from 'lucide-react'

interface Metrics {
  alcance: number
  impressoes: number
  frequencia: number
  cliquesNoLink: number
  cliquesTotais: number
  ctr: number
  cpc: number
  cpm: number
  valorGasto: number
  conversasIniciadas: number
  custoPorConversa: number
  leads: number
  custoPorLead: number
  compras: number
  custoPorCompra: number
  adicionouAoCarrinho: number
  iniciouCheckout: number
  visualizouPagina: number
  curtidas: number
  comentarios: number
  compartilhamentos: number
  salvamentos: number
  reproducoes: number
}

interface Ad       { id: string; name: string; status: string; metrics: Metrics | null }
interface AdSet    { id: string; name: string; status: string; metrics: Metrics | null; ads: Ad[] }
interface Campaign { id: string; name: string; status: string; objective: string; metrics: Metrics | null; adsets: AdSet[] }

function fmt(n: number)  { return n.toLocaleString('pt-BR') }
function money(n: number){ return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function pct(n: number)  { return n.toFixed(2).replace('.', ',') + '%' }

function objectiveLabel(obj: string) {
  const map: Record<string, string> = {
    'CONVERSIONS': 'Vendas', 'MESSAGES': 'Mensagens', 'LEAD_GENERATION': 'Leads',
    'LINK_CLICKS': 'Tráfego', 'REACH': 'Alcance', 'BRAND_AWARENESS': 'Reconhecimento',
    'VIDEO_VIEWS': 'Visualizações de vídeo', 'ENGAGEMENT': 'Engajamento',
    'OUTCOME_TRAFFIC': 'Tráfego', 'OUTCOME_LEADS': 'Leads', 'OUTCOME_SALES': 'Vendas',
    'OUTCOME_AWARENESS': 'Reconhecimento', 'OUTCOME_ENGAGEMENT': 'Engajamento',
  }
  return map[obj] ?? obj
}

const DATE_OPTIONS = [
  { value: 'today',       label: 'Hoje' },
  { value: 'yesterday',   label: 'Ontem' },
  { value: 'last_7d',     label: '7 dias' },
  { value: 'last_14d',    label: '14 dias' },
  { value: 'last_30d',    label: '30 dias' },
  { value: 'this_month',  label: 'Este mês' },
  { value: 'last_month',  label: 'Mês passado' },
]

/* ─────────────────────────────────────────────────
   CARD DE CAMPANHA
   ───────────────────────────────────────────────── */
function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const m = campaign.metrics
  const active = campaign.status === 'ACTIVE'

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      {/* Nome + status */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
              {campaign.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-5 text-[10px]">
            <span className={`font-medium ${active ? 'text-green-500' : 'text-gray-400'}`}>
              {active ? 'Ativa' : 'Pausada'}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-gray-400">Objetivo: {objectiveLabel(campaign.objective)}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-gray-400">{campaign.adsets.length} conjunto{campaign.adsets.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
      </div>

      {/* Métricas reais do Meta */}
      {m ? (
        <div className="px-5 pb-4 pt-1">
          {/* Linha principal */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-3">
            <MiniMetric label="Alcance" value={fmt(m.alcance)} />
            <MiniMetric label="Impressões" value={fmt(m.impressoes)} />
            <MiniMetric label="Cliques no link" value={fmt(m.cliquesNoLink)} />
            <MiniMetric label="CTR" value={pct(m.ctr)} />
            <MiniMetric label="CPC" value={money(m.cpc)} />
            <MiniMetric label="Valor gasto" value={money(m.valorGasto)} highlight />
          </div>

          {/* Linha de conversões (só mostra o que tem valor > 0) */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-wrap gap-x-5 gap-y-1">
            {m.conversasIniciadas > 0 && (
              <ConversionChip icon={MessageCircle} label="Conversas iniciadas" value={fmt(m.conversasIniciadas)} cost={money(m.custoPorConversa)} color="text-green-500" />
            )}
            {m.leads > 0 && (
              <ConversionChip icon={UserPlus} label="Leads" value={fmt(m.leads)} cost={money(m.custoPorLead)} color="text-blue-500" />
            )}
            {m.compras > 0 && (
              <ConversionChip icon={ShoppingCart} label="Compras" value={fmt(m.compras)} cost={money(m.custoPorCompra)} color="text-purple-500" />
            )}
            {m.adicionouAoCarrinho > 0 && (
              <ConversionChip icon={ShoppingCart} label="Adicionou ao carrinho" value={fmt(m.adicionouAoCarrinho)} color="text-amber-500" />
            )}
            {m.visualizouPagina > 0 && (
              <ConversionChip icon={Eye} label="Visualizou página" value={fmt(m.visualizouPagina)} color="text-gray-500" />
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 text-xs text-gray-400">Sem dados no período</div>
      )}
    </div>
  )
}

function MiniMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-amber-500' : 'text-gray-800 dark:text-white'}`}>{value}</p>
    </div>
  )
}

function ConversionChip({ icon: Icon, label, value, cost, color }: {
  icon: React.ElementType; label: string; value: string; cost?: string; color: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon size={12} className={color} />
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className={`font-bold ${color}`}>{value}</span>
      {cost && <span className="text-gray-400 text-[10px]">({cost}/cada)</span>}
    </span>
  )
}

/* ─────────────────────────────────────────────────
   CARD DE CONJUNTO
   ───────────────────────────────────────────────── */
function AdSetCard({ adset, onClick }: { adset: AdSet; onClick: () => void }) {
  const m = adset.metrics
  const active = adset.status === 'ACTIVE'

  return (
    <div onClick={onClick} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group">
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <Layers size={14} className="text-blue-400 shrink-0" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
              {adset.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-5 text-[10px]">
            <span className={`font-medium ${active ? 'text-green-500' : 'text-gray-400'}`}>{active ? 'Ativo' : 'Pausado'}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-gray-400">{adset.ads.length} anúncio{adset.ads.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
      </div>

      {m ? (
        <div className="px-5 pb-4 pt-1">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-3">
            <MiniMetric label="Alcance" value={fmt(m.alcance)} />
            <MiniMetric label="Impressões" value={fmt(m.impressoes)} />
            <MiniMetric label="Cliques no link" value={fmt(m.cliquesNoLink)} />
            <MiniMetric label="CTR" value={pct(m.ctr)} />
            <MiniMetric label="CPC" value={money(m.cpc)} />
            <MiniMetric label="Valor gasto" value={money(m.valorGasto)} highlight />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-wrap gap-x-5 gap-y-1">
            {m.conversasIniciadas > 0 && <ConversionChip icon={MessageCircle} label="Conversas iniciadas" value={fmt(m.conversasIniciadas)} cost={money(m.custoPorConversa)} color="text-green-500" />}
            {m.leads > 0 && <ConversionChip icon={UserPlus} label="Leads" value={fmt(m.leads)} cost={money(m.custoPorLead)} color="text-blue-500" />}
            {m.compras > 0 && <ConversionChip icon={ShoppingCart} label="Compras" value={fmt(m.compras)} cost={money(m.custoPorCompra)} color="text-purple-500" />}
            {m.adicionouAoCarrinho > 0 && <ConversionChip icon={ShoppingCart} label="Carrinho" value={fmt(m.adicionouAoCarrinho)} color="text-amber-500" />}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 text-xs text-gray-400">Sem dados no período</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   CARD DE ANÚNCIO — expande pra ver tudo
   ───────────────────────────────────────────────── */
function AdCard({ ad }: { ad: Ad }) {
  const m = ad.metrics
  const active = ad.status === 'ACTIVE'
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div onClick={() => setOpen(!open)} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Image size={14} className="text-purple-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{ad.name}</h3>
            <span className={`text-[10px] font-medium ${active ? 'text-green-500' : 'text-gray-400'}`}>{active ? 'Ativo' : 'Pausado'}</span>
          </div>
        </div>

        {/* Resumo inline quando fechado */}
        {!open && m && (
          <div className="hidden md:flex items-center gap-4 text-[11px] text-gray-400 mr-3">
            <span>Gasto: <strong className="text-gray-700 dark:text-gray-300">{money(m.valorGasto)}</strong></span>
            <span>Alcance: <strong className="text-gray-700 dark:text-gray-300">{fmt(m.alcance)}</strong></span>
            <span>Cliques: <strong className="text-gray-700 dark:text-gray-300">{fmt(m.cliquesNoLink)}</strong></span>
          </div>
        )}

        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && m && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4 space-y-4">
          {/* Entrega */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Entrega</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricRow label="Alcance" value={fmt(m.alcance)} sub="pessoas diferentes" />
              <MetricRow label="Impressões" value={fmt(m.impressoes)} sub="vezes que apareceu" />
              <MetricRow label="Frequência" value={m.frequencia.toFixed(1)} sub="vezes por pessoa" />
              <MetricRow label="CPM" value={money(m.cpm)} sub="custo por mil impressões" />
            </div>
          </div>

          {/* Cliques */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Cliques</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricRow label="Cliques no link" value={fmt(m.cliquesNoLink)} />
              <MetricRow label="Todos os cliques" value={fmt(m.cliquesTotais)} />
              <MetricRow label="CTR" value={pct(m.ctr)} sub="taxa de cliques" />
              <MetricRow label="CPC" value={money(m.cpc)} sub="custo por clique" />
            </div>
          </div>

          {/* Conversões / Ações — só mostra as que existem */}
          {(m.conversasIniciadas > 0 || m.leads > 0 || m.compras > 0 || m.adicionouAoCarrinho > 0 || m.iniciouCheckout > 0 || m.visualizouPagina > 0) && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Conversões</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {m.conversasIniciadas > 0 && <MetricRow label="Conversas iniciadas" value={fmt(m.conversasIniciadas)} sub={`${money(m.custoPorConversa)} cada`} color="text-green-500" />}
                {m.leads > 0             && <MetricRow label="Leads" value={fmt(m.leads)} sub={m.custoPorLead > 0 ? `${money(m.custoPorLead)} cada` : undefined} color="text-blue-500" />}
                {m.compras > 0           && <MetricRow label="Compras" value={fmt(m.compras)} sub={`${money(m.custoPorCompra)} cada`} color="text-purple-500" />}
                {m.adicionouAoCarrinho > 0 && <MetricRow label="Adicionou ao carrinho" value={fmt(m.adicionouAoCarrinho)} />}
                {m.iniciouCheckout > 0   && <MetricRow label="Iniciou checkout" value={fmt(m.iniciouCheckout)} />}
                {m.visualizouPagina > 0  && <MetricRow label="Visualizou página" value={fmt(m.visualizouPagina)} />}
              </div>
            </div>
          )}

          {/* Investimento */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-amber-500" />
              <span className="text-xs text-gray-500">Valor gasto:</span>
              <span className="text-base font-bold text-gray-800 dark:text-white">{money(m.valorGasto)}</span>
            </div>
          </div>
        </div>
      )}

      {open && !m && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700/50 pt-3 text-xs text-gray-400">
          Sem dados no período selecionado
        </div>
      )}
    </div>
  )
}

function MetricRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className={`text-sm font-bold ${color ?? 'text-gray-800 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   RESUMO NO TOPO
   ───────────────────────────────────────────────── */
function TopSummary({ m, campaigns }: { m: Metrics; campaigns: Campaign[] }) {
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resumo geral</p>
        <span className="text-[10px] text-gray-400">{activeCount} campanha{activeCount !== 1 ? 's' : ''} ativa{activeCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Valor gasto</p>
          <p className="text-lg font-bold text-amber-500">{money(m.valorGasto)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Alcance</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{fmt(m.alcance)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Impressões</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{fmt(m.impressoes)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Cliques no link</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{fmt(m.cliquesNoLink)}</p>
        </div>
        {m.conversasIniciadas > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Conversas</p>
            <p className="text-lg font-bold text-green-500">{fmt(m.conversasIniciadas)}</p>
          </div>
        )}
        {m.compras > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Compras</p>
            <p className="text-lg font-bold text-purple-500">{fmt(m.compras)}</p>
          </div>
        )}
        {m.leads > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Leads</p>
            <p className="text-lg font-bold text-blue-500">{fmt(m.leads)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   PÁGINA
   ───────────────────────────────────────────────── */
export default function GerenciadorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [demo, setDemo]           = useState(false)
  const [datePreset, setDatePreset] = useState('last_30d')

  const [onlyActive, setOnlyActive]             = useState(false)
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

  function sumMetrics(items: { metrics: Metrics | null }[]): Metrics | null {
    const valid = items.filter(i => i.metrics) as { metrics: Metrics }[]
    if (valid.length === 0) return null
    const sum = { ...valid[0].metrics }
    for (const key of Object.keys(sum) as (keyof Metrics)[]) {
      sum[key] = valid.reduce((s, i) => s + (i.metrics[key] ?? 0), 0)
    }
    // Recalcular taxas
    sum.ctr = sum.impressoes > 0 ? (sum.cliquesNoLink / sum.impressoes) * 100 : 0
    sum.cpc = sum.cliquesNoLink > 0 ? sum.valorGasto / sum.cliquesNoLink : 0
    sum.cpm = sum.impressoes > 0 ? (sum.valorGasto / sum.impressoes) * 1000 : 0
    sum.frequencia = sum.alcance > 0 ? sum.impressoes / sum.alcance : 0
    sum.custoPorConversa = sum.conversasIniciadas > 0 ? sum.valorGasto / sum.conversasIniciadas : 0
    sum.custoPorLead = sum.leads > 0 ? sum.valorGasto / sum.leads : 0
    sum.custoPorCompra = sum.compras > 0 ? sum.valorGasto / sum.compras : 0
    return sum
  }

  // Filtra campanhas por status
  const filteredCampaigns = onlyActive
    ? campaigns.filter(c => c.status === 'ACTIVE')
    : campaigns

  const totalMetrics = sumMetrics(filteredCampaigns)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {(selectedCampaign || selectedAdSet) && (
            <button
              onClick={() => selectedAdSet ? setSelectedAdSet(null) : setSelectedCampaign(null)}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <LayoutGrid size={22} className="text-blue-400" />
              Gerenciador de Anúncios
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <button onClick={() => { setSelectedCampaign(null); setSelectedAdSet(null) }}
                className={`hover:text-blue-500 ${!selectedCampaign ? 'text-blue-500 font-medium' : ''}`}>
                Campanhas
              </button>
              {selectedCampaign && (
                <><ChevronRight size={10} /><button onClick={() => setSelectedAdSet(null)}
                  className={`hover:text-blue-500 truncate max-w-[180px] ${!selectedAdSet ? 'text-blue-500 font-medium' : ''}`}>
                  {selectedCampaign.name}</button></>
              )}
              {selectedAdSet && (
                <><ChevronRight size={10} /><span className="text-blue-500 font-medium truncate max-w-[180px]">{selectedAdSet.name}</span></>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1">
            {DATE_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setDatePreset(o.value)}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  datePreset === o.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOnlyActive(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
              onlyActive
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-green-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlyActive ? 'bg-white' : 'bg-green-400'}`} />
            Somente ativas
          </button>
        </div>
      </div>

      {demo && (
        <div className="mb-5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Dados de demonstração</p>
            <p className="text-xs mt-0.5 opacity-80">Conecte sua conta Meta em <strong>Configurações</strong> para ver dados reais.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">Carregando campanhas...</p>
        </div>
      ) : (
        <>
          {/* Resumo geral (só na visão de campanhas) */}
          {!selectedCampaign && totalMetrics && <TopSummary m={totalMetrics} campaigns={filteredCampaigns} />}

          {/* CAMPANHAS */}
          {!selectedCampaign && (
            <div className="space-y-3">
              {filteredCampaigns.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Megaphone size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 font-medium">
                    {onlyActive ? 'Nenhuma campanha ativa no momento' : 'Nenhuma campanha encontrada'}
                  </p>
                </div>
              ) : filteredCampaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} onClick={() => setSelectedCampaign(c)} />
              ))}
            </div>
          )}

          {/* CONJUNTOS */}
          {selectedCampaign && !selectedAdSet && (() => {
            const adsets = onlyActive
              ? selectedCampaign.adsets.filter(as => as.status === 'ACTIVE')
              : selectedCampaign.adsets
            return (
              <div className="space-y-3">
                {adsets.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Layers size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 font-medium">
                      {onlyActive ? 'Nenhum conjunto ativo nesta campanha' : 'Nenhum conjunto encontrado'}
                    </p>
                  </div>
                ) : adsets.map(as => (
                  <AdSetCard key={as.id} adset={as} onClick={() => setSelectedAdSet(as)} />
                ))}
              </div>
            )
          })()}

          {/* ANÚNCIOS */}
          {selectedAdSet && (() => {
            const ads = onlyActive
              ? selectedAdSet.ads.filter(ad => ad.status === 'ACTIVE')
              : selectedAdSet.ads
            return (
              <div className="space-y-3">
                {ads.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Image size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 font-medium">
                      {onlyActive ? 'Nenhum anúncio ativo neste conjunto' : 'Nenhum anúncio encontrado'}
                    </p>
                  </div>
                ) : ads.map(ad => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
