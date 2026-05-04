'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useTheme } from 'next-themes'

interface ChartData {
  month: string
  spend: number
  leads: number
  appointments?: number
  revenue?: number
}

interface MonthlyComparisonChartProps {
  data: ChartData[]
}

export default function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor    = isDark ? '#1f2937' : '#f0f7ff'
  const textColor    = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg    = isDark ? '#111827' : '#ffffff'
  const tooltipBorder = isDark ? '#1f2937' : '#bfdbfe'

  const lastIndex = data.length - 1

  const nameMap: Record<string, string> = {
    spend: 'Verba',
    leads: 'Leads',
    appointments: 'Agendamentos',
    revenue: 'Faturamento',
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Comparativo Mensal</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Agendamentos e faturamento por mês</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={30}
            tickFormatter={v => String(v)} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
            labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              name === 'revenue'
                ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : value.toLocaleString('pt-BR'),
              nameMap[name] ?? name,
            ]}
          />
          <Legend formatter={v => nameMap[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="appointments" radius={[6, 6, 0, 0]} maxBarSize={35}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#f59e0b' : isDark ? '#78350f' : '#fef3c7'} />
            ))}
          </Bar>
          <Bar yAxisId="right" dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={35}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#34d399' : isDark ? '#064e3b' : '#d1fae5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
