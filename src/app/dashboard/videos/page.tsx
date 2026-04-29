'use client'

import { useEffect, useState } from 'react'
import { Video, Play, Clock, RefreshCw, TrendingUp, Eye } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from 'next-themes'

interface VideoData {
  videoPlays: number; video25Pct: number; video50Pct: number
  video75Pct: number; video100Pct: number; avgWatchTime: number
  costPerThruplay: number; thruplayWatched: number
  impressions: number
}

export default function VideosPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState<VideoData | null>(null)
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
        videoPlays: m.videoPlays, video25Pct: m.video25Pct, video50Pct: m.video50Pct,
        video75Pct: m.video75Pct, video100Pct: m.video100Pct, avgWatchTime: m.avgWatchTime,
        costPerThruplay: m.costPerThruplay, thruplayWatched: m.thruplayWatched,
        impressions: m.impressions,
      })
    } finally { setLoading(false) }
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    number: (v: number) => v.toLocaleString('pt-BR'),
    seconds: (v: number) => v >= 60 ? `${Math.floor(v / 60)}m ${Math.round(v % 60)}s` : `${v.toFixed(1)}s`,
  }

  const retentionData = data ? [
    { label: 'Assistiram 25%', value: data.video25Pct,  pct: data.videoPlays > 0 ? Math.round((data.video25Pct  / data.videoPlays) * 100) : 0 },
    { label: 'Assistiram 50%', value: data.video50Pct,  pct: data.videoPlays > 0 ? Math.round((data.video50Pct  / data.videoPlays) * 100) : 0 },
    { label: 'Assistiram 75%', value: data.video75Pct,  pct: data.videoPlays > 0 ? Math.round((data.video75Pct  / data.videoPlays) * 100) : 0 },
    { label: 'Assistiram 100%',value: data.video100Pct, pct: data.videoPlays > 0 ? Math.round((data.video100Pct / data.videoPlays) * 100) : 0 },
  ] : []

  const pieData = data ? [
    { name: 'Completaram', value: data.video100Pct, color: '#60a5fa' },
    { name: 'Desistiram',  value: Math.max(0, data.videoPlays - data.video100Pct), color: isDark ? '#1f2937' : '#dbeafe' },
  ] : []

  const grid = isDark ? '#1f2937' : '#f0f7ff'
  const text = isDark ? '#6b7280' : '#9ca3af'
  const tipBg = isDark ? '#111827' : '#ffffff'
  const tipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const completionRate = data && data.videoPlays > 0 ? ((data.video100Pct / data.videoPlays) * 100).toFixed(1) : '0.0'

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video size={22} className="text-blue-400" /> Vídeos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Desempenho dos seus anúncios em vídeo</p>
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

      {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricCard title="Reproduções" value={fmt.number(data.videoPlays)} icon={Play} color="blue" subtitle="Vídeos iniciados" />
            <MetricCard title="Visualizaram tudo" value={fmt.number(data.video100Pct)} icon={Eye} color="green" subtitle={`${completionRate}% completaram`} />
            <MetricCard title="Tempo médio" value={fmt.seconds(data.avgWatchTime)} icon={Clock} color="purple" subtitle="Por reprodução" />
            <MetricCard title="Custo por ThruPlay" value={fmt.currency(data.costPerThruplay)} icon={TrendingUp} color="orange" subtitle="Assistiu 15s ou mais" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Retenção */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Retenção do Vídeo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Quantas pessoas assistiram cada parte</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={retentionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="label" tick={{ fill: text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: text, fontSize: 10 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: tipBg, border: `1px solid ${tipBorder}`, borderRadius: 12 }}
                    formatter={(v: number) => [`${v}%`, 'Retiveram']} />
                  <Area type="monotone" dataKey="pct" stroke="#60a5fa" strokeWidth={2} fill="url(#retGrad)" dot={{ fill: '#60a5fa', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Taxa de conclusão */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 flex flex-col items-center justify-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 self-start">Taxa de conclusão</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 self-start">Percentual que assistiu o vídeo até o fim</p>
              <PieChart width={180} height={180}>
                <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <p className="text-3xl font-bold text-gray-900 dark:text-white -mt-6">{completionRate}%</p>
              <p className="text-sm text-gray-400">completaram o vídeo</p>
            </div>
          </div>

          {/* ThruPlays */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-400 rounded-2xl flex items-center justify-center shadow-md shadow-blue-400/20">
                <Video size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ThruPlays (15s ou mais)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt.number(data.thruplayWatched)}</p>
                <p className="text-xs text-gray-400 mt-0.5">pessoas viram ao menos 15 segundos do seu vídeo</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
