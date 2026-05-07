'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTheme } from 'next-themes'

interface ChartData {
  month: string
  spend: number
  clicks: number
  leads: number
  conversationsStarted?: number
  appointments?: number
  revenue?: number
}

interface SpendChartProps {
  data: ChartData[]
}

export default function SpendChart({ data }: SpendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor  = 'rgba(255,255,255,0.06)'
  const textColor  = 'rgba(148,186,255,0.45)'
  const tooltipBg  = 'rgba(7,16,31,0.9)'
  const tooltipBorder = 'rgba(255,255,255,0.1)'
  void isDark

  const nameMap: Record<string, string> = {
    spend: 'Verba investida',
    conversationsStarted: 'Conversas iniciadas',
    revenue: 'Faturamento',
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold glass-text-primary mb-1">Evolução Mensal</h3>
      <p className="text-sm glass-text-muted mb-5">Investimento, conversas iniciadas e faturamento nos últimos 6 meses</p>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradConversations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={v => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
            labelStyle={{ color: '#e8f0ff', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              ['spend', 'revenue'].includes(name)
                ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : value.toLocaleString('pt-BR'),
              nameMap[name as string] ?? name,
            ]}
          />
          <Legend formatter={v => nameMap[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="spend"                stroke="#60a5fa" strokeWidth={2} fill="url(#gradSpend)"         dot={{ fill: '#60a5fa', r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="conversationsStarted" stroke="#a78bfa" strokeWidth={2} fill="url(#gradConversations)" dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="revenue"              stroke="#34d399" strokeWidth={2} fill="url(#gradRevenue)"        dot={{ fill: '#34d399', r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
