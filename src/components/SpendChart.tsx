'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTheme } from 'next-themes'

interface MonthlyData {
  month: string
  spend: number
  clicks: number
  conversions: number
}

interface SpendChartProps {
  data: MonthlyData[]
}

export default function SpendChart({ data }: SpendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor  = isDark ? '#1f2937' : '#f0f7ff'
  const textColor  = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg  = isDark ? '#111827' : '#ffffff'
  const tooltipBorder = isDark ? '#1f2937' : '#bfdbfe'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Evolução Mensal</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Verba investida e cliques nos últimos 6 meses</p>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={50}
            tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
            labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              name === 'spend' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value.toLocaleString('pt-BR'),
              name === 'spend' ? 'Verba' : 'Cliques',
            ]}
          />
          <Legend formatter={v => v === 'spend' ? 'Verba' : 'Cliques'} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="spend"  stroke="#60a5fa" strokeWidth={2} fill="url(#gradSpend)"  dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
          <Area type="monotone" dataKey="clicks" stroke="#a78bfa" strokeWidth={2} fill="url(#gradClicks)" dot={{ fill: '#a78bfa', r: 4 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
