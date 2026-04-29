'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, RefreshCw, Calendar } from 'lucide-react'

interface ReportMetrics {
  spend: number; impressions: number; clicks: number; ctr: number
  cpc: number; cpm: number; reach: number; roas: number
  conversions: number; conversationsStarted: number; leads: number
  videoPlays: number; postEngagements: number
}
interface Client { id: string; name: string }

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [period, setPeriod] = useState('this_month')
  const [data, setData] = useState<ReportMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(c => { setClients(c); if (c.length > 0) setClientId(c[0].id) })
  }, [])

  async function generateReport() {
    if (!clientId) return
    setLoading(true)
    setGenerated(false)
    try {
      const res = await fetch(`/api/meta/metrics?clientId=${clientId}&datePreset=${period}`)
      const json = await res.json()
      const m = json.metrics
      setData({
        spend: m.spend, impressions: m.impressions, clicks: m.clicks, ctr: m.ctr,
        cpc: m.cpc, cpm: m.cpm, reach: m.reach, roas: m.roas,
        conversions: m.conversions, conversationsStarted: m.conversationsStarted,
        leads: m.leads, videoPlays: m.videoPlays, postEngagements: m.postEngagements,
      })
      setGenerated(true)
    } finally { setLoading(false) }
  }

  function downloadCSV() {
    if (!data) return
    const client = clients.find(c => c.id === clientId)
    const lines = [
      'Métrica,Valor',
      `Verba Investida,"${fmt.currency(data.spend)}"`,
      `Impressões,"${fmt.number(data.impressions)}"`,
      `Cliques,"${fmt.number(data.clicks)}"`,
      `CTR,"${fmt.percent(data.ctr)}"`,
      `CPC,"${fmt.currency(data.cpc)}"`,
      `CPM,"${fmt.currency(data.cpm)}"`,
      `Alcance,"${fmt.number(data.reach)}"`,
      `ROAS,"${data.roas.toFixed(2)}x"`,
      `Conversões,"${fmt.number(data.conversions)}"`,
      `Conversas Iniciadas,"${fmt.number(data.conversationsStarted)}"`,
      `Leads,"${fmt.number(data.leads)}"`,
      `Reproduções de Vídeo,"${fmt.number(data.videoPlays)}"`,
      `Engajamentos,"${fmt.number(data.postEngagements)}"`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bluemetrics-relatorio-${client?.name ?? 'conta'}-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() { window.print() }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
    percent: (v: number) => `${v.toFixed(2)}%`,
  }

  const periodLabels: Record<string, string> = {
    today: 'Hoje', yesterday: 'Ontem', last_7d: 'Últimos 7 dias',
    last_30d: 'Últimos 30 dias', this_month: 'Este mês', last_month: 'Mês passado'
  }

  const client = clients.find(c => c.id === clientId)

  const rows: { label: string; value: string; desc: string }[] = data ? [
    { label: 'Verba Investida',      value: fmt.currency(data.spend),              desc: 'Total gasto em anúncios no período' },
    { label: 'Pessoas Alcançadas',   value: fmt.number(data.reach),                desc: 'Usuários únicos que viram seu anúncio' },
    { label: 'Impressões',           value: fmt.number(data.impressions),          desc: 'Total de exibições do anúncio' },
    { label: 'Cliques',              value: fmt.number(data.clicks),               desc: 'Pessoas que clicaram no anúncio' },
    { label: 'CTR',                  value: fmt.percent(data.ctr),                 desc: 'Taxa de cliques sobre impressões' },
    { label: 'CPC',                  value: fmt.currency(data.cpc),               desc: 'Custo médio por clique' },
    { label: 'CPM',                  value: fmt.currency(data.cpm),               desc: 'Custo a cada 1.000 impressões' },
    { label: 'ROAS',                 value: `${data.roas.toFixed(2)}x`,           desc: 'Retorno sobre investimento em anúncios' },
    { label: 'Conversões',           value: fmt.number(data.conversions),          desc: 'Ações de conversão registradas' },
    { label: 'Conversas Iniciadas',  value: fmt.number(data.conversationsStarted), desc: 'Mensagens enviadas via WhatsApp/Messenger' },
    { label: 'Leads Captados',       value: fmt.number(data.leads),               desc: 'Formulários e cadastros preenchidos' },
    { label: 'Reproduções de Vídeo', value: fmt.number(data.videoPlays),           desc: 'Vezes que o vídeo foi reproduzido' },
    { label: 'Engajamentos',         value: fmt.number(data.postEngagements),      desc: 'Curtidas, comentários e compartilhamentos' },
  ] : []

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText size={22} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-sm text-gray-400">Gere e exporte relatórios completos</p>
        </div>
      </div>

      {/* Configuração */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Configurar relatório</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Conta</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Período</label>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last_7d">Últimos 7 dias</option>
              <option value="last_30d">Últimos 30 dias</option>
              <option value="this_month">Este mês</option>
              <option value="last_month">Mês passado</option>
            </select>
          </div>
        </div>
        <button onClick={generateReport} disabled={loading || !clientId}
          className="w-full py-2.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Gerando...' : 'Gerar relatório'}
        </button>
      </div>

      {/* Relatório gerado */}
      {generated && data && (
        <div id="report-content">
          {/* Cabeçalho do relatório */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-6 mb-4 text-white shadow-lg shadow-blue-400/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">BlueMetrics</p>
                <h2 className="text-xl font-bold mt-1">Relatório de Anúncios</h2>
                <p className="text-blue-100 text-sm mt-1">{client?.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-blue-100 text-xs">
                  <Calendar size={12} /> {periodLabels[period]}
                </div>
                <p className="text-blue-100 text-xs mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Tabela de métricas */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100 dark:border-gray-800">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Métrica</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.label} className={`border-b border-blue-50 dark:border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-blue-50/30 dark:bg-gray-800/30'}`}>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.label}</td>
                      <td className="px-5 py-3 text-sm font-bold text-blue-500 text-right whitespace-nowrap">{row.value}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 hidden sm:table-cell">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botões de exportação */}
          <div className="flex gap-3">
            <button onClick={downloadCSV}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-400/20">
              <Download size={15} /> Baixar CSV
            </button>
            <button onClick={printReport}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-blue-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800">
              <FileText size={15} /> Imprimir / PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
