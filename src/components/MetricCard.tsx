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
  blue:   { gradient: 'linear-gradient(160deg, #3b82f6 0%, #1d4ed8 100%)', shadow: 'rgba(59,130,246,0.35)' },
  green:  { gradient: 'linear-gradient(160deg, #22c55e 0%, #16a34a 100%)', shadow: 'rgba(34,197,94,0.35)' },
  purple: { gradient: 'linear-gradient(160deg, #a855f7 0%, #7c3aed 100%)', shadow: 'rgba(168,85,247,0.35)' },
  orange: { gradient: 'linear-gradient(160deg, #f97316 0%, #ea580c 100%)', shadow: 'rgba(249,115,22,0.35)' },
}

export default function MetricCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: MetricCardProps) {
  const c = colorMap[color]
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div
      className="rounded-2xl p-5 transition-all hover:translate-y-[-2px]"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{
            background: c.gradient,
            boxShadow: `0 4px 12px ${c.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[45%]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)' }} />
          <Icon size={18} className="text-white relative z-10" />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: trendPositive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: trendPositive ? '#4ade80' : '#f87171',
              border: `1px solid ${trendPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'rgba(180,210,255,0.6)' }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: '#e8f0ff' }}>{value}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: 'rgba(148,186,255,0.4)' }}>{subtitle}</p>}
    </div>
  )
}
