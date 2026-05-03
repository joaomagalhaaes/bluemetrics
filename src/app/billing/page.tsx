'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart2, Check, Loader2, ShieldCheck, Zap, Clock } from 'lucide-react'

const REASONS: Record<string, { title: string; desc: string; color: string }> = {
  trial_expired: {
    title: 'Seu período de teste encerrou',
    desc: 'Seus 7 dias grátis chegaram ao fim. Assine agora para continuar acessando o BlueMetrics.',
    color: 'text-amber-600 dark:text-amber-400',
  },
  suspended: {
    title: 'Conta pausada por pagamento pendente',
    desc: 'Seu acesso foi pausado pois o pagamento não foi processado. Assine novamente para reativar.',
    color: 'text-red-600 dark:text-red-400',
  },
  no_subscription: {
    title: 'Escolha seu plano',
    desc: 'Comece com 7 dias grátis. Cancele quando quiser.',
    color: 'text-blue-600 dark:text-blue-400',
  },
  cancelled: {
    title: 'Assinatura cancelada',
    desc: 'Sua assinatura foi cancelada. Reative para continuar usando.',
    color: 'text-gray-600 dark:text-gray-400',
  },
}

export default function BillingPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-400" size={32} /></div>}>
      <BillingPage />
    </Suspense>
  )
}

function BillingPage() {
  const router = useRouter()
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'no_subscription'
  const cancelled = params.get('cancelled') === '1'

  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) setLoggedIn(true)
    })
  }, [])

  async function subscribe(plan: 'monthly' | 'annual') {
    if (!loggedIn) { router.push('/register'); return }
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error ?? 'Erro ao iniciar pagamento')
    } finally {
      setLoading(null)
    }
  }

  const info = REASONS[reason] ?? REASONS.no_subscription

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-400/30">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-none">BlueMetrics</p>
          <p className="text-xs text-blue-400">Meta Ads Analytics</p>
        </div>
      </div>

      {/* Aviso de cancelamento */}
      {cancelled && (
        <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-300">
          Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      {/* Título */}
      <div className="text-center mb-10 max-w-lg">
        <h1 className={`text-2xl font-bold mb-2 ${info.color}`}>{info.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{info.desc}</p>
      </div>

      {/* Cards de plano */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mb-8">

        {/* Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100 dark:border-gray-700 p-6 flex flex-col">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Mensal</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">R$87</span>
            <span className="text-gray-400 text-sm mb-1">/mês</span>
          </div>
          <p className="text-xs text-gray-400 mb-6">Cobrado mensalmente</p>
          <ul className="space-y-2 mb-8 flex-1">
            {features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Check size={14} className="text-blue-400 flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
          <button onClick={() => subscribe('monthly')} disabled={loading !== null}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {loading === 'monthly' ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : 'Assinar mensalmente'}
          </button>
        </div>

        {/* Anual — destaque */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 flex flex-col shadow-xl shadow-blue-500/30 relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Economize R$119
          </div>
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Anual</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-4xl font-bold text-white">R$925</span>
            <span className="text-blue-200 text-sm mb-1">/ano</span>
          </div>
          <p className="text-xs text-blue-200 mb-6">≈ R$77/mês — 2 meses grátis</p>
          <ul className="space-y-2 mb-8 flex-1">
            {features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <Check size={14} className="text-white flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
          <button onClick={() => subscribe('annual')} disabled={loading !== null}
            className="w-full py-3 bg-white hover:bg-blue-50 disabled:opacity-60 text-blue-600 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {loading === 'annual' ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : 'Assinar anualmente'}
          </button>
        </div>
      </div>

      {/* Garantias */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400" /> 7 dias grátis</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-400" /> Pagamento seguro via Stripe</span>
        <span className="flex items-center gap-1.5"><Zap size={14} className="text-blue-400" /> Acesso imediato</span>
      </div>

      {loggedIn && (
        <button onClick={() => router.push('/dashboard')}
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline">
          Voltar ao dashboard
        </button>
      )}
    </div>
  )
}

const features = [
  'Métricas Meta Ads em tempo real',
  'CRM & Leads do WhatsApp',
  'Calendário de agendamentos',
  'Funil de conversão visual',
  'Gerenciador de campanhas',
  'Relatórios completos',
  'Suporte via WhatsApp',
]
