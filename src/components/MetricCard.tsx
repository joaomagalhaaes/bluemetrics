'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: number
  subtitle?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

const colorMap = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-400',   text: 'text-blue-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-400',  text: 'text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'bg-purple-400', text: 'text-purple-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',icon: 'bg-orange-400', text: 'text-orange-400' },
}

export default function MetricCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: MetricCardProps) {
  const c = colorMap[color]
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trendPositive
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
