'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, RefreshCw, Calendar, CalendarCheck } from 'lucide-react'

interface ReportMetrics {
  spend: number; impressions: number; clicks: number; ctr: number
  cpc: number; cpm: number; reach: number; roas: number
  conversions: number; conversationsStarted: number; leads: number
  videoPlays: number; postEngagements: number
}
interface Client { id: string; name: string }
interface Appointment {
  id: string; clientName: string; service: string | null
  value: number; date: string; status: string
}
interface AppointmentSummary {
  total: number; totalValue: number
  completed: number; completedValue: number
  scheduled: number; cancelled: number
}

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [period, setPeriod] = useState('this_month')
  const [data, setData] = useState<ReportMetrics | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [apptSummary, setApptSummary] = useState<AppointmentSummary | null>(null)
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
      const [metricsRes, apptRes] = await Promise.all([
        fetch(`/api/meta/metrics?clientId=${clientId}&datePreset=${period}`),
        fetch(`/api/appointments?period=${period === 'this_month' || period === 'last_30d' ? 'month' : period === 'last_7d' || period === 'today' || period === 'yesterday' ? 'week' : 'all'}`),
      ])
      const metricsJson = await metricsRes.json()
      const apptJson = await apptRes.json()
      const m = metricsJson.metrics
      setData({
        spend: m.spend, impressions: m.impressions, clicks: m.clicks, ctr: m.ctr,
        cpc: m.cpc, cpm: m.cpm, reach: m.reach, roas: m.roas,
        conversions: m.conversions, conversationsStarted: m.conversationsStarted,
        leads: m.leads, videoPlays: m.videoPlays, postEngagements: m.postEngagements,
      })
      setAppointments(apptJson.appointments ?? [])
      setApptSummary(apptJson.summary ?? null)
      setGenerated(true)
    } finally { setLoading(false) }
  }

  function downloadCSV() {
    if (!data) return
    const client = clients.find(c => c.id === clientId)
    const dateRange = getPeriodDateRange(period)
    const lines = [
      `BlueMetrics - Relatório de Anúncios - ${client?.name ?? 'conta'}`,
      `Período: ${periodLabels[period]} — ${dateRange}`,
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
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
      '',
      'AGENDAMENTOS',
      `Total de agendamentos,"${apptSummary?.total ?? 0}"`,
      `Valor total,"${fmt.currency(apptSummary?.totalValue ?? 0)}"`,
      `Realizados,"${apptSummary?.completed ?? 0}"`,
      `Valor realizado,"${fmt.currency(apptSummary?.completedValue ?? 0)}"`,
      `Agendados,"${apptSummary?.scheduled ?? 0}"`,
      `Cancelados,"${apptSummary?.cancelled ?? 0}"`,
      '',
      'RESUMO FINANCEIRO',
      `Investido em anúncios,"${fmt.currency(data.spend)}"`,
      `Faturado (agendamentos realizados),"${fmt.currency(apptSummary?.completedValue ?? 0)}"`,
      `Lucro,"${fmt.currency((apptSummary?.completedValue ?? 0) - data.spend)}"`,
      `ROI,"${data.spend > 0 ? (((apptSummary?.completedValue ?? 0) / data.spend - 1) * 100).toFixed(0) : 0}%"`,
    ]

    if (appointments.length > 0) {
      lines.push('', 'DETALHAMENTO DOS AGENDAMENTOS', 'Cliente,Serviço,Valor,Data,Status')
      appointments.forEach(a => {
        const statusLabel = a.status === 'completed' ? 'Realizado' : a.status === 'cancelled' ? 'Cancelado' : 'Agendado'
        lines.push(`"${a.clientName}","${a.service ?? '-'}","${fmt.currency(a.value)}","${new Date(a.date).toLocaleDateString('pt-BR')}","${statusLabel}"`)
      })
    }

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

  // Calcula as datas de referência do período selecionado
  function getPeriodDateRange(p: string): string {
    const now = new Date()
    let start: Date
    let end: Date

    switch (p) {
      case 'today':
        start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday': {
        const d = new Date(now)
        d.setDate(d.getDate() - 1)
        start = end = d
        break
      }
      case 'last_7d': {
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        start = new Date(end)
        start.setDate(start.getDate() - 6)
        break
      }
      case 'last_30d': {
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        start = new Date(end)
        start.setDate(start.getDate() - 29)
        break
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0) // último dia do mês anterior
        break
      default:
        return ''
    }

    const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    if (start.getTime() === end.getTime()) {
      return `Referente a ${fmtDate(start)}`
    }
    return `Referente a ${fmtDate(start)} a ${fmtDate(end)}`
  }

  const client = clients.find(c => c.id === clientId)

  const investido = data?.spend ?? 0
  const faturado = apptSummary?.completedValue ?? 0
  const lucro = faturado - investido
  const roi = investido > 0 ? ((faturado / investido) - 1) * 100 : 0

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
                <p className="text-white text-xs font-medium mt-1">{getPeriodDateRange(period)}</p>
                <p className="text-blue-200 text-[10px] mt-0.5">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full" /> Resumo Financeiro
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Investido</p>
                <p className="text-lg font-bold text-blue-500">{fmt.currency(investido)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Faturado</p>
                <p className="text-lg font-bold text-green-500">{fmt.currency(faturado)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Lucro</p>
                <p className={`text-lg font-bold ${lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {lucro >= 0 ? '+' : ''}{fmt.currency(lucro)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">ROI</p>
                <p className={`text-lg font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {roi.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de métricas de anúncios */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full" /> Métricas de Anúncios
              </h3>
            </div>
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

          {/* Seção de Agendamentos */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck size={15} className="text-blue-400" /> Agendamentos
              </h3>
            </div>

            {/* Resumo de agendamentos */}
            {apptSummary && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-5 border-b border-blue-50 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Total</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{apptSummary.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Valor total</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{fmt.currency(apptSummary.totalValue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Realizados</p>
                  <p className="text-lg font-bold text-green-500">{apptSummary.completed}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Faturado</p>
                  <p className="text-sm font-bold text-green-500">{fmt.currency(apptSummary.completedValue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Agendados</p>
                  <p className="text-lg font-bold text-blue-500">{apptSummary.scheduled}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Cancelados</p>
                  <p className="text-lg font-bold text-red-400">{apptSummary.cancelled}</p>
                </div>
              </div>
            )}

            {/* Lista detalhada de agendamentos */}
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100 dark:border-gray-800">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Serviço</th>
                      <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-center px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a, i) => (
                      <tr key={a.id} className={`border-b border-blue-50 dark:border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-blue-50/30 dark:bg-gray-800/30'}`}>
                        <td className="px-5 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{a.clientName}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-500 hidden sm:table-cell">{a.service ?? '-'}</td>
                        <td className="px-5 py-2.5 text-sm font-bold text-blue-500 text-right whitespace-nowrap">{fmt.currency(a.value)}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            a.status === 'completed' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            a.status === 'cancelled' ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              a.status === 'completed' ? 'bg-green-400' : a.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'
                            }`} />
                            {a.status === 'completed' ? 'Realizado' : a.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
                Nenhum agendamento no período
              </div>
            )}
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
