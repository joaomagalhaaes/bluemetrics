'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useTheme } from 'next-themes'

interface MonthlyData {
  month: string
  roas: number
}

export default function RoasChart({ data }: { data: MonthlyData[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor     = isDark ? '#1f2937' : '#f0f7ff'
  const textColor     = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg     = isDark ? '#111827' : '#ffffff'
  const tooltipBorder = isDark ? '#1f2937' : '#bfdbfe'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">ROAS Mensal</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Retorno sobre investimento em anúncios (linha de 1x = break-even)</p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={35}
            tickFormatter={v => `${v}x`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 12 }}
            labelStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 600 }}
            formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROAS']}
          />
          <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'break-even', fill: '#ef4444', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="roas"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ fill: '#60a5fa', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
