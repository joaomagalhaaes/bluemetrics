'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'

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
  const gridColor    = 'rgba(255,255,255,0.06)'
  const textColor    = 'rgba(148,186,255,0.45)'
  const tooltipBg    = 'rgba(7,16,31,0.9)'
  const tooltipBorder = 'rgba(255,255,255,0.1)'

  const lastIndex = data.length - 1

  const nameMap: Record<string, string> = {
    spend: 'Verba',
    leads: 'Leads',
    appointments: 'Agendamentos',
    revenue: 'Faturamento',
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold glass-text-primary mb-1">Comparativo Mensal</h3>
      <p className="text-sm glass-text-muted mb-5">Agendamentos e faturamento por mês</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={30}
            tickFormatter={v => String(v)} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={55}
            tickFormatter={v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12, backdropFilter: 'blur(12px)' }}
            labelStyle={{ color: '#e8f0ff', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              name === 'revenue'
                ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : value.toLocaleString('pt-BR'),
              nameMap[name] ?? name,
            ]}
          />
          <Legend formatter={v => nameMap[v] ?? v} wrapperStyle={{ fontSize: 12, color: 'rgba(148,186,255,0.5)' }} />
          <Bar yAxisId="left" dataKey="appointments" radius={[6, 6, 0, 0]} maxBarSize={35}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#f59e0b' : 'rgba(245,158,11,0.2)'} />
            ))}
          </Bar>
          <Bar yAxisId="right" dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={35}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === lastIndex ? '#34d399' : 'rgba(52,211,153,0.2)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
