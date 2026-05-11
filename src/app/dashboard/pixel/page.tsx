'use client'

import { useEffect, useState } from 'react'
import {
  Zap, ShoppingCart, Users, DollarSign, RefreshCw, Eye, CreditCard,
  UserCheck, Search, Star, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check, Code, Clock, MessageCircle, MousePointer, Video,
  Heart, ChevronDown, ChevronUp, Settings, Save, TrendingDown,
  TrendingUp, Target, BarChart3
} from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from 'next-themes'

interface PixelInfo {
  id: string
  name: string
  lastFiredTime: string | null
  isUnavailable: boolean
  creationTime: string | null
  code: string | null
}

interface PixelData {
  pixelFires: number; pixelPurchases: number; pixelLeads: number
  pixelAddToCart: number; pixelInitiateCheckout: number
  pixelCompleteRegistration: number; pixelViewContent: number
  pixelSearches: number; pixelCustomEvents: number
  spend: number; roas: number; purchaseValue: number
}

interface CreativeBreakdown {
  adName: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  spend: number
  costPerResult: number
}

export default function PixelPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState<PixelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [period, setPeriod] = useState('last_30d')

  // Pixel info
  const [pixels, setPixels] = useState<PixelInfo[]>([])
  const [pixelStatus, setPixelStatus] = useState('')
  const [pixelEvents, setPixelEvents] = useState<Record<string, number>>({})
  const [pixelLoading, setPixelLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Pixel editor
  const [showPixelEditor, setShowPixelEditor] = useState(false)
  const [selectedPixelId, setSelectedPixelId] = useState('')
  const [customPixelId, setCustomPixelId] = useState('')
  const [savedPixelId, setSavedPixelId] = useState<string | null>(null)
  const [savingPixel, setSavingPixel] = useState(false)
  const [pixelSaved, setPixelSaved] = useState(false)

  // Diagnóstico de conversão
  const [creativeBreakdown, setCreativeBreakdown] = useState<CreativeBreakdown[]>([])
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(c => { setClients(c); if (c.length > 0) setClientId(c[0].id) })
  }, [])

  useEffect(() => {
    if (clientId) {
      load()
      loadPixelInfo()
    }
  }, [clientId, period])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta/metrics?clientId=${clientId}&datePreset=${period}`)
      const json = await res.json()
      const m = json.metrics
      if (m) {
        setData({
          pixelFires: m.pixelFires, pixelPurchases: m.pixelPurchases, pixelLeads: m.pixelLeads,
          pixelAddToCart: m.pixelAddToCart, pixelInitiateCheckout: m.pixelInitiateCheckout,
          pixelCompleteRegistration: m.pixelCompleteRegistration, pixelViewContent: m.pixelViewContent,
          pixelSearches: m.pixelSearches, pixelCustomEvents: m.pixelCustomEvents,
          spend: m.spend, roas: m.roas, purchaseValue: m.purchaseValue,
        })
      }
    } finally { setLoading(false) }
  }

  async function loadPixelInfo() {
    setPixelLoading(true)
    try {
      const res = await fetch(`/api/meta/pixels?clientId=${clientId}`)
      const json = await res.json()
      setPixels(json.pixels ?? [])
      setPixelStatus(json.status ?? '')
      setPixelEvents(json.events ?? {})
      setCreativeBreakdown(json.creativeBreakdown ?? [])
      setSavedPixelId(json.savedPixelId ?? null)
      if (json.savedPixelId) {
        setSelectedPixelId(json.savedPixelId)
      } else if (json.pixels?.length > 0) {
        setSelectedPixelId(json.pixels[0].id)
      }
    } finally { setPixelLoading(false) }
  }

  async function savePixel() {
    const pixelToSave = customPixelId.trim() || selectedPixelId
    if (!pixelToSave || !clientId) return
    setSavingPixel(true)
    try {
      const res = await fetch('/api/meta/pixels/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, pixelId: pixelToSave }),
      })
      if (res.ok) {
        setSavedPixelId(pixelToSave)
        setPixelSaved(true)
        setTimeout(() => setPixelSaved(false), 3000)
        setShowPixelEditor(false)
        setCustomPixelId('')
      }
    } finally { setSavingPixel(false) }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
    percent: (v: number) => `${v.toFixed(2)}%`,
  }

  const funnelData = data ? [
    { stage: 'Visualizaram', value: data.pixelViewContent, color: '#93c5fd' },
    { stage: 'Pesquisaram', value: data.pixelSearches, color: '#60a5fa' },
    { stage: 'Carrinho', value: data.pixelAddToCart, color: '#3b82f6' },
    { stage: 'Checkout', value: data.pixelInitiateCheckout, color: '#2563eb' },
    { stage: 'Compraram', value: data.pixelPurchases, color: '#1d4ed8' },
  ] : []

  const hasPixelEvents = funnelData.some(d => d.value > 0)

  // Eventos reais da conta
  const realEvents: Array<{ key: string; label: string; icon: typeof MessageCircle; color: 'blue' | 'green' | 'orange' | 'purple' }> = [
    { key: 'onsite_conversion.messaging_conversation_started_7d', label: 'Conversas iniciadas', icon: MessageCircle, color: 'green' },
    { key: 'onsite_conversion.messaging_first_reply', label: 'Respostas recebidas', icon: MessageCircle, color: 'blue' },
    { key: 'link_click', label: 'Cliques no link', icon: MousePointer, color: 'blue' },
    { key: 'landing_page_view', label: 'Visualizações da página', icon: Eye, color: 'purple' },
    { key: 'video_view', label: 'Visualizações de vídeo', icon: Video, color: 'orange' },
    { key: 'post_engagement', label: 'Engajamento no post', icon: Heart, color: 'purple' },
    { key: 'post_reaction', label: 'Reações', icon: Heart, color: 'orange' },
    { key: 'comment', label: 'Comentários', icon: MessageCircle, color: 'green' },
  ]

  const activeRealEvents = realEvents.filter(e => (pixelEvents[e.key] ?? 0) > 0)

  // Diagnóstico inteligente
  function getDiagnostics() {
    const diagnostics: Array<{ type: 'danger' | 'warning' | 'success'; title: string; description: string; icon: typeof TrendingDown }> = []

    const impressions = pixelEvents['impressions'] ?? 0
    const clicks = pixelEvents['link_click'] ?? 0
    const landingViews = pixelEvents['landing_page_view'] ?? 0
    const conversations = pixelEvents['onsite_conversion.messaging_conversation_started_7d'] ?? 0
    const videoViews = pixelEvents['video_view'] ?? 0
    const engagement = pixelEvents['post_engagement'] ?? 0

    // Análise do criativo (CTR)
    if (impressions > 0 && clicks > 0) {
      const ctr = (clicks / impressions) * 100
      if (ctr < 1) {
        diagnostics.push({
          type: 'danger',
          title: 'Criativo com baixa performance',
          description: `CTR de ${ctr.toFixed(2)}% (abaixo de 1%). O criativo (imagem/vídeo) não está chamando atenção. Teste novos criativos com ganchos mais fortes, cores vibrantes ou depoimentos.`,
          icon: TrendingDown,
        })
      } else if (ctr < 2) {
        diagnostics.push({
          type: 'warning',
          title: 'CTR pode melhorar',
          description: `CTR de ${ctr.toFixed(2)}% (entre 1-2%). O criativo está ok, mas pode melhorar. Teste variações com headlines diferentes ou formatos de vídeo.`,
          icon: Target,
        })
      } else {
        diagnostics.push({
          type: 'success',
          title: 'Criativo performando bem',
          description: `CTR de ${ctr.toFixed(2)}% (acima de 2%). O criativo está atraindo cliques. Continue testando variações para manter a performance.`,
          icon: TrendingUp,
        })
      }
    }

    // Análise da VSL / Landing Page
    if (clicks > 0 && landingViews > 0) {
      const landingRate = (landingViews / clicks) * 100
      if (landingRate < 50) {
        diagnostics.push({
          type: 'danger',
          title: 'Página de destino com problema',
          description: `Apenas ${landingRate.toFixed(0)}% dos cliques viraram visualizações. A página pode estar lenta, com erro ou o link está quebrado. Verifique a velocidade de carregamento.`,
          icon: TrendingDown,
        })
      }
    }

    // Análise de conversão (página → conversa/compra)
    if (landingViews > 0 && conversations > 0) {
      const convRate = (conversations / landingViews) * 100
      if (convRate < 5) {
        diagnostics.push({
          type: 'warning',
          title: 'Baixa conversão na página',
          description: `Taxa de ${convRate.toFixed(1)}% de conversão. Visitantes estão vendo a página mas não estão agindo. Pode ser: VSL fraca, oferta pouco clara, botão de CTA escondido, ou preço não competitivo.`,
          icon: TrendingDown,
        })
      } else if (convRate >= 10) {
        diagnostics.push({
          type: 'success',
          title: 'Boa taxa de conversão',
          description: `${convRate.toFixed(1)}% dos visitantes estão convertendo. A página/VSL está funcionando bem.`,
          icon: TrendingUp,
        })
      }
    } else if (landingViews > 50 && conversations === 0) {
      diagnostics.push({
        type: 'danger',
        title: 'Nenhuma conversão detectada',
        description: `${landingViews} pessoas viram a página mas ninguém converteu. Revise: a VSL pode não estar convencendo, a oferta pode não ser atrativa, ou o botão de ação pode estar mal posicionado.`,
        icon: TrendingDown,
      })
    }

    // Análise de vídeo/VSL
    if (videoViews > 0 && impressions > 0) {
      const viewRate = (videoViews / impressions) * 100
      if (viewRate < 15) {
        diagnostics.push({
          type: 'warning',
          title: 'VSL/Vídeo com retenção baixa',
          description: `Apenas ${viewRate.toFixed(1)}% das impressões assistiram. O início do vídeo precisa de um gancho mais forte nos primeiros 3 segundos.`,
          icon: Video,
        })
      }
    }

    // Análise de engajamento
    if (engagement > 0 && impressions > 0) {
      const engRate = (engagement / impressions) * 100
      if (engRate < 1) {
        diagnostics.push({
          type: 'warning',
          title: 'Baixo engajamento',
          description: `Taxa de engajamento de ${engRate.toFixed(2)}%. O conteúdo não está gerando interação. Teste perguntas, enquetes ou conteúdo mais provocativo.`,
          icon: Heart,
        })
      }
    }

    // Se não há dados suficientes
    if (diagnostics.length === 0) {
      diagnostics.push({
        type: 'warning',
        title: 'Dados insuficientes para diagnóstico',
        description: 'Aguarde mais dados de campanhas ativas para gerar um diagnóstico detalhado. O ideal é ter pelo menos 7 dias de dados.',
        icon: BarChart3,
      })
    }

    return diagnostics
  }

  // Análise por criativo
  function getCreativeAnalysis() {
    if (creativeBreakdown.length === 0) return []

    return creativeBreakdown
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map(ad => {
        const convRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0
        let status: 'good' | 'ok' | 'bad' = 'ok'
        let diagnosis = ''

        if (ad.ctr < 1) {
          status = 'bad'
          diagnosis = 'CTR baixo — criativo não atrai cliques'
        } else if (ad.ctr >= 2 && convRate >= 5) {
          status = 'good'
          diagnosis = 'Performance excelente'
        } else if (ad.ctr >= 1 && convRate < 2) {
          status = 'ok'
          diagnosis = 'Atrai cliques mas não converte — problema na página/oferta'
        } else if (ad.conversions === 0 && ad.clicks > 20) {
          status = 'bad'
          diagnosis = 'Nenhuma conversão — verifique a landing page ou VSL'
        } else {
          diagnosis = 'Performance mediana'
        }

        return { ...ad, convRate, status, diagnosis }
      })
  }

  const grid = isDark ? '#1f2937' : '#f0f7ff'
  const text = isDark ? '#6b7280' : '#9ca3af'
  const tipBg = isDark ? '#111827' : '#ffffff'
  const tipBorder = isDark ? '#1f2937' : '#bfdbfe'

  // Usa o pixel salvo ou o primeiro
  const pixel = savedPixelId
    ? pixels.find(p => p.id === savedPixelId) ?? pixels[0]
    : pixels[0]

  const diagnostics = getDiagnostics()
  const creativeAnalysis = getCreativeAnalysis()

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={22} className="text-blue-400" /> Pixel & Conversões
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Status do pixel, diagnóstico e rastreamento de eventos</p>
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
          <button onClick={() => { load(); loadPixelInfo() }} disabled={loading} className="p-2 bg-blue-400 text-white rounded-xl">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ═══ STATUS DO PIXEL ═══ */}
      {!pixelLoading && (
        <div className={`rounded-2xl border p-5 mb-5 ${
          pixelStatus === 'OK' && pixel && !pixel.isUnavailable
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : pixelStatus === 'NO_PIXEL'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : pixelStatus === 'NO_TOKEN'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          {pixelStatus === 'OK' && pixel ? (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">Pixel ativo</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{pixel.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Pixel ID</p>
                    <div className="flex items-center gap-1.5">
                      <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{pixel.id}</code>
                      <button onClick={() => copyToClipboard(pixel.id, 'id')}
                        className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                        {copied === 'id' ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  {/* Botão alterar pixel */}
                  <button onClick={() => setShowPixelEditor(!showPixelEditor)}
                    className="p-2 rounded-xl bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                    title="Alterar pixel">
                    <Settings size={16} className="text-green-600 dark:text-green-400" />
                  </button>
                </div>
              </div>

              {/* Feedback de pixel salvo */}
              {pixelSaved && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                  <CheckCircle2 size={14} />
                  Pixel atualizado com sucesso!
                </div>
              )}

              {/* Editor de Pixel */}
              {showPixelEditor && (
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Settings size={14} /> Alterar Pixel
                  </h3>

                  {/* Selecionar de pixels existentes */}
                  {pixels.length > 1 && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pixels disponíveis na conta:</label>
                      <div className="space-y-2">
                        {pixels.map(px => (
                          <label key={px.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedPixelId === px.id
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200'
                            }`}>
                            <input type="radio" name="pixel" value={px.id}
                              checked={selectedPixelId === px.id}
                              onChange={() => { setSelectedPixelId(px.id); setCustomPixelId('') }}
                              className="accent-blue-500" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{px.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{px.id}</p>
                            </div>
                            {savedPixelId === px.id && (
                              <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                                Atual
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input manual */}
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      {pixels.length > 1 ? 'Ou insira um Pixel ID manualmente:' : 'Insira o Pixel ID:'}
                    </label>
                    <input type="text" value={customPixelId}
                      onChange={e => { setCustomPixelId(e.target.value); if (e.target.value) setSelectedPixelId('') }}
                      placeholder="Ex: 123456789012345"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={savePixel} disabled={savingPixel || (!selectedPixelId && !customPixelId.trim())}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {savingPixel ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      Salvar Pixel
                    </button>
                    <button onClick={() => setShowPixelEditor(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Info do pixel */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-green-200 dark:border-green-700">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Último disparo</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Clock size={12} />
                    {pixel.lastFiredTime
                      ? new Date(pixel.lastFiredTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Nunca disparou'}
                  </p>
                  {pixel.lastFiredTime && (() => {
                    const diffDays = Math.floor((Date.now() - new Date(pixel.lastFiredTime).getTime()) / 86400000)
                    if (diffDays > 7) return <p className="text-[10px] text-amber-500 mt-0.5">Há {diffDays} dias sem disparar</p>
                    if (diffDays > 0) return <p className="text-[10px] text-green-500 mt-0.5">Disparou há {diffDays} dia{diffDays > 1 ? 's' : ''}</p>
                    return <p className="text-[10px] text-green-500 mt-0.5">Disparou hoje</p>
                  })()}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Status</p>
                  <p className={`text-sm font-semibold ${pixel.isUnavailable ? 'text-red-500' : 'text-green-500'}`}>
                    {pixel.isUnavailable ? 'Indisponível' : 'Funcionando'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Criado em</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {pixel.creationTime ? new Date(pixel.creationTime).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>

              {/* Botão código */}
              <button onClick={() => setShowCode(!showCode)}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                <Code size={14} />
                {showCode ? 'Ocultar código de instalação' : 'Ver código de instalação'}
                {showCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showCode && (
                <div className="mt-3 bg-gray-900 rounded-xl p-4 relative">
                  <button onClick={() => copyToClipboard(
                    `<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${pixel.id}');\nfbq('track', 'PageView');\n</script>\n<noscript><img height="1" width="1" style="display:none"\nsrc="https://www.facebook.com/tr?id=${pixel.id}&ev=PageView&noscript=1"\n/></noscript>\n<!-- End Meta Pixel Code -->`,
                    'code'
                  )} className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                    {copied === 'code' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-300" />}
                  </button>
                  <pre className="text-xs text-green-400 overflow-x-auto leading-relaxed"><code>{`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel.id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixel.id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`}</code></pre>
                </div>
              )}
            </>
          ) : pixelStatus === 'NO_PIXEL' ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle size={22} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">Nenhum Pixel encontrado</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Esta conta de anúncios não tem um Pixel configurado. Crie um no Meta Business Suite ou insira manualmente.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <a href="https://business.facebook.com/events_manager2/list/pixel/" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Criar Pixel no Meta
                  </a>
                  <button onClick={() => setShowPixelEditor(!showPixelEditor)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Settings size={12} /> Inserir Pixel ID
                  </button>
                </div>

                {/* Editor manual quando não tem pixel */}
                {showPixelEditor && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Insira o Pixel ID manualmente:</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={customPixelId}
                        onChange={e => setCustomPixelId(e.target.value)}
                        placeholder="Ex: 123456789012345"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                      />
                      <button onClick={savePixel} disabled={savingPixel || !customPixelId.trim()}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors">
                        {savingPixel ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                        Salvar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : pixelStatus === 'NO_TOKEN' ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Token não configurado</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Configure o Token de Acesso em &quot;Conta de Anúncios&quot; para ver os dados do pixel.
                </p>
                <a href="/dashboard/clients"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  Configurar Token
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {pixelLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ═══ DIAGNÓSTICO DE CONVERSÃO ═══ */}
      {!pixelLoading && pixelStatus === 'OK' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
          <button onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 size={16} className="text-purple-500" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white">Diagnóstico de Conversão</h2>
                <p className="text-[10px] text-gray-400">Por que as pessoas não estão comprando?</p>
              </div>
            </div>
            {showDiagnostic ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {showDiagnostic && (
            <div className="px-5 pb-5 space-y-3">
              {/* Diagnósticos automáticos */}
              {diagnostics.map((d, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                  d.type === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : d.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                      : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    d.type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                    d.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <d.icon size={16} className={
                      d.type === 'danger' ? 'text-red-500' :
                      d.type === 'warning' ? 'text-amber-500' :
                      'text-green-500'
                    } />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      d.type === 'danger' ? 'text-red-700 dark:text-red-300' :
                      d.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                      'text-green-700 dark:text-green-300'
                    }`}>{d.title}</p>
                    <p className={`text-xs mt-0.5 ${
                      d.type === 'danger' ? 'text-red-600 dark:text-red-400' :
                      d.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>{d.description}</p>
                  </div>
                </div>
              ))}

              {/* Breakdown por criativo */}
              {creativeAnalysis.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Target size={14} className="text-blue-400" />
                    Performance por Criativo/Anúncio
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {creativeAnalysis.map((ad, i) => (
                      <div key={i} className={`p-3 rounded-xl border transition-all ${
                        ad.status === 'good'
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : ad.status === 'bad'
                            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{ad.adName}</p>
                            <p className={`text-[10px] mt-0.5 font-semibold ${
                              ad.status === 'good' ? 'text-green-500' :
                              ad.status === 'bad' ? 'text-red-500' :
                              'text-amber-500'
                            }`}>{ad.diagnosis}</p>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ad.status === 'good' ? 'bg-green-100 dark:bg-green-900/40 text-green-600' :
                            ad.status === 'bad' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                            'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                          }`}>
                            {ad.status === 'good' ? 'Bom' : ad.status === 'bad' ? 'Ruim' : 'Regular'}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase">CTR</p>
                            <p className={`text-xs font-bold ${ad.ctr >= 2 ? 'text-green-500' : ad.ctr < 1 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              {fmt.percent(ad.ctr)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase">Cliques</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{fmt.number(ad.clicks)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase">Conversões</p>
                            <p className={`text-xs font-bold ${ad.conversions > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                              {fmt.number(ad.conversions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase">Gasto</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{fmt.currency(ad.spend)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ EVENTOS REAIS DA CONTA ═══ */}
      {activeRealEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Zap size={16} className="text-blue-400" />
              Eventos rastreados (últimos 30 dias)
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Dados reais da sua conta de anúncios</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {activeRealEvents.map(e => (
              <MetricCard key={e.key} title={e.label} value={fmt.number(pixelEvents[e.key])} icon={e.icon} color={e.color}
                subtitle={e.key.split('.').pop()?.replace(/_/g, ' ') ?? ''} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ DADOS DO PIXEL (se tiver) ═══ */}
      {data && !loading && (
        <>
          {hasPixelEvents ? (
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
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28} fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Eventos individuais */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                <MetricCard title="Visualizações de produto" value={fmt.number(data.pixelViewContent)} icon={Eye} color="blue" subtitle="ViewContent" />
                <MetricCard title="Leads captados" value={fmt.number(data.pixelLeads)} icon={Users} color="green" subtitle="Lead" />
                <MetricCard title="Adicionaram ao carrinho" value={fmt.number(data.pixelAddToCart)} icon={ShoppingCart} color="purple" subtitle="AddToCart" />
                <MetricCard title="Iniciaram pagamento" value={fmt.number(data.pixelInitiateCheckout)} icon={CreditCard} color="orange" subtitle="InitiateCheckout" />
                <MetricCard title="Cadastros completos" value={fmt.number(data.pixelCompleteRegistration)} icon={UserCheck} color="blue" subtitle="CompleteRegistration" />
                <MetricCard title="Buscas realizadas" value={fmt.number(data.pixelSearches)} icon={Search} color="green" subtitle="Search" />
              </div>
            </>
          ) : (
            /* Sem eventos de pixel — mostra guia de instalação */
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 mb-5 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" />
                  Eventos de conversão do Pixel
                </h2>
              </div>
              <div className="px-5 py-8 text-center">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={28} className="text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nenhum evento de conversão detectado</p>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  {pixel
                    ? 'O pixel está instalado mas não está disparando eventos de conversão (Purchase, Lead, AddToCart...). Configure os eventos no seu site.'
                    : 'Instale o Meta Pixel no site do cliente para rastrear conversões como compras, leads e carrinhos.'}
                </p>
                <button onClick={() => setShowGuide(!showGuide)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                  <Code size={14} />
                  {showGuide ? 'Ocultar guia' : 'Como configurar eventos'}
                </button>
              </div>

              {showGuide && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">1. Instale o Pixel base no site</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Cole o código do pixel no {'<head>'} de todas as páginas. {pixel ? 'Veja o código acima clicando em "Ver código de instalação".' : 'Crie um pixel no Meta Business Suite primeiro.'}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">2. Adicione eventos de conversão</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                      Adicione chamadas de evento nas páginas certas do site:
                    </p>
                    <div className="bg-gray-900 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="text-[10px] text-gray-400">Na página de produto:</p>
                        <code className="text-xs text-green-400">{"fbq('track', 'ViewContent', {content_name: 'Produto X', value: 99.90, currency: 'BRL'});"}</code>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Ao adicionar no carrinho:</p>
                        <code className="text-xs text-green-400">{"fbq('track', 'AddToCart', {value: 99.90, currency: 'BRL'});"}</code>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">No checkout:</p>
                        <code className="text-xs text-green-400">{"fbq('track', 'InitiateCheckout', {value: 99.90, currency: 'BRL'});"}</code>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Na confirmação de compra:</p>
                        <code className="text-xs text-green-400">{"fbq('track', 'Purchase', {value: 99.90, currency: 'BRL'});"}</code>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">No formulário de lead:</p>
                        <code className="text-xs text-green-400">{"fbq('track', 'Lead', {content_name: 'Formulário contato'});"}</code>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">3. Teste com o Meta Pixel Helper</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Instale a extensão &quot;Meta Pixel Helper&quot; no Chrome para verificar se os eventos estão disparando corretamente.
                    </p>
                    <a href="https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-500 hover:text-blue-600 underline">
                      Baixar Meta Pixel Helper
                    </a>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">4. Alternativa: Configurar pelo Meta Events Manager</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Sem acesso ao código do site? Use o Meta Events Manager para configurar eventos sem código.
                    </p>
                    <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-500 hover:text-blue-600 underline">
                      Abrir Events Manager
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
