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
  appointments?: number
  revenue?: number
}

interface SpendChartProps {
  data: ChartData[]
}

export default function SpendChart({ data }: SpendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor  = isDark ? '#1f2937' : '#f0f7ff'
  const textColor  = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg  = isDark ? '#111827' : '#ffffff'
  const tooltipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const nameMap: Record<string, string> = {
    spend: 'Verba investida',
    leads: 'Leads',
    appointments: 'Agendamentos',
    revenue: 'Faturamento',
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Evolução Mensal</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Investimento, leads e faturamento nos últimos 6 meses</p>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
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
            labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              ['spend', 'revenue'].includes(name)
                ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : value.toLocaleString('pt-BR'),
              nameMap[name] ?? name,
            ]}
          />
          <Legend formatter={v => nameMap[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="spend"   stroke="#60a5fa" strokeWidth={2} fill="url(#gradSpend)"   dot={{ fill: '#60a5fa', r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="leads"   stroke="#a78bfa" strokeWidth={2} fill="url(#gradLeads)"   dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} fill="url(#gradRevenue)" dot={{ fill: '#34d399', r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
