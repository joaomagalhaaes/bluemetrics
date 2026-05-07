'use client'

import { useEffect, useState } from 'react'
import {
  Zap, ShoppingCart, Users, DollarSign, RefreshCw, Eye, CreditCard,
  UserCheck, Search, Star, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check, Code, Clock, MessageCircle, MousePointer, Video,
  Heart, ChevronDown, ChevronUp
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
    } finally { setPixelLoading(false) }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
  }

  const funnelData = data ? [
    { stage: 'Visualizaram', value: data.pixelViewContent, color: '#93c5fd' },
    { stage: 'Pesquisaram', value: data.pixelSearches, color: '#60a5fa' },
    { stage: 'Carrinho', value: data.pixelAddToCart, color: '#3b82f6' },
    { stage: 'Checkout', value: data.pixelInitiateCheckout, color: '#2563eb' },
    { stage: 'Compraram', value: data.pixelPurchases, color: '#1d4ed8' },
  ] : []

  const hasPixelEvents = funnelData.some(d => d.value > 0)

  // Eventos reais da conta (conversas, cliques etc)
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

  const grid = isDark ? '#1f2937' : '#f0f7ff'
  const text = isDark ? '#6b7280' : '#9ca3af'
  const tipBg = isDark ? '#111827' : '#ffffff'
  const tipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const pixel = pixels[0] // Primeiro pixel (geralmente só tem 1)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={22} className="text-blue-400" /> Pixel & Conversões
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Status do pixel e rastreamento de eventos</p>
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
              </div>

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
                    if (diffDays > 7) return <p className="text-[10px] text-amber-500 mt-0.5">⚠️ Há {diffDays} dias sem disparar</p>
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
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">Nenhum Pixel encontrado</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Esta conta de anúncios não tem um Pixel configurado. Crie um no Meta Business Suite.
                </p>
                <a href="https://business.facebook.com/events_manager2/list/pixel/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Criar Pixel no Meta
                </a>
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
