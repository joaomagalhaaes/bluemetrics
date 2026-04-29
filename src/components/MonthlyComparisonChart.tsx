'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useTheme } from 'next-themes'

interface MonthlyData {
  month: string
  spend: number
  conversions: number
  roas: number
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[]
}

export default function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor    = isDark ? '#1f2937' : '#f0f7ff'
  const textColor    = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg    = isDark ? '#111827' : '#ffffff'
  const tooltipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const lastIndex = data.length - 1

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Comparativo Mensal</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Verba e conversões por mês — mês atual destacado</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={50}
            tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
            labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              name === 'spend' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
              name === 'spend' ? 'Verba' : 'Conversões',
            ]}
          />
          <Legend formatter={v => v === 'spend' ? 'Verba' : 'Conversões'} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="spend" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#60a5fa' : isDark ? '#1e3a5f' : '#bfdbfe'} />
            ))}
          </Bar>
          <Bar dataKey="conversions" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#34d399' : isDark ? '#064e3b' : '#d1fae5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
