'use client'

import { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, ExternalLink, BarChart2 } from 'lucide-react'

interface SubStatus {
  status: string
  plan: string | null
  trialEnd: string | null
  currentPeriodEnd: string | null
  gracePeriodEnd: string | null
  allowed: boolean
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof CheckCircle2; bg: string }> = {
  admin:     { label: 'Administrador',     color: 'text-purple-600',  icon: CheckCircle2,  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  active:    { label: 'Ativa',             color: 'text-green-600',   icon: CheckCircle2,  bg: 'bg-green-50 dark:bg-green-900/20' },
  trial:     { label: 'Trial gratuito',    color: 'text-blue-600',    icon: Clock,         bg: 'bg-blue-50 dark:bg-blue-900/20' },
  grace:     { label: 'Pagamento pendente',color: 'text-amber-600',   icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20' },
  suspended: { label: 'Pausada',           color: 'text-red-600',     icon: XCircle,       bg: 'bg-red-50 dark:bg-red-900/20' },
  cancelled: { label: 'Cancelada',         color: 'text-gray-500',    icon: XCircle,       bg: 'bg-gray-50 dark:bg-gray-800' },
  none:      { label: 'Sem assinatura',    color: 'text-gray-500',    icon: XCircle,       bg: 'bg-gray-50 dark:bg-gray-800' },
}

const PLAN_NAMES: Record<string, string> = {
  monthly: 'Mensal — R$87/mês',
  annual:  'Anual — R$925/ano',
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null)
  const success = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === '1'

  useEffect(() => {
    fetch('/api/billing/status').then(r => r.json()).then(data => {
      setSub(data)
      setLoading(false)
    })
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error ?? 'Erro ao abrir portal')
    setPortalLoading(false)
  }

  async function checkout(plan: 'monthly' | 'annual') {
    setCheckoutLoading(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error ?? 'Erro ao criar sessão')
    setCheckoutLoading(null)
  }

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    )
  }

  const info = STATUS_INFO[sub?.status ?? 'none'] ?? STATUS_INFO.none
  const Icon = info.icon
  const hasStripe = sub?.status === 'active' || sub?.status === 'grace' || sub?.status === 'trial'
  const canSubscribe = !sub?.allowed || sub?.status === 'trial' || sub?.status === 'none'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard size={22} className="text-blue-400" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Assinatura</h1>
      </div>

      {success && (
        <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-500" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300 text-sm">Assinatura ativada com sucesso!</p>
            <p className="text-xs text-green-600 dark:text-green-400">Seu acesso completo ao BlueMetrics está ativo.</p>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className={`rounded-2xl border p-5 mb-5 ${info.bg} border-current/20`}>
        <div className="flex items-center gap-3 mb-4">
          <Icon size={22} className={info.color} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status da assinatura</p>
            <p className={`font-bold text-lg ${info.color}`}>{info.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {sub?.plan && (
            <div>
              <p className="text-xs text-gray-400">Plano</p>
              <p className="font-semibold text-gray-800 dark:text-white">{PLAN_NAMES[sub.plan] ?? sub.plan}</p>
            </div>
          )}
          {sub?.trialEnd && sub.status === 'trial' && (
            <div>
              <p className="text-xs text-gray-400">Trial até</p>
              <p className="font-semibold text-gray-800 dark:text-white">{fmt(sub.trialEnd)}</p>
            </div>
          )}
          {sub?.currentPeriodEnd && sub.status === 'active' && (
            <div>
              <p className="text-xs text-gray-400">Próxima cobrança</p>
              <p className="font-semibold text-gray-800 dark:text-white">{fmt(sub.currentPeriodEnd)}</p>
            </div>
          )}
          {sub?.gracePeriodEnd && sub.status === 'grace' && (
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Prazo para regularizar</p>
              <p className="font-semibold text-amber-700 dark:text-amber-300">{fmt(sub.gracePeriodEnd)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      {sub?.status === 'active' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="font-semibold text-gray-800 dark:text-white mb-1 text-sm">Gerenciar assinatura</p>
          <p className="text-xs text-gray-400 mb-4">Altere o método de pagamento, veja faturas ou cancele pelo portal seguro do Stripe.</p>
          <button onClick={openPortal} disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {portalLoading ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
            Abrir portal de pagamento
          </button>
        </div>
      )}

      {sub?.status === 'grace' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5">
          <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1 text-sm">Atualize seu método de pagamento</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
            Seu último pagamento falhou. Você tem até {fmt(sub.gracePeriodEnd)} para regularizar antes de sua conta ser pausada.
          </p>
          <button onClick={openPortal} disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {portalLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            Atualizar cartão
          </button>
        </div>
      )}

      {(canSubscribe && sub?.status !== 'admin') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="font-semibold text-gray-800 dark:text-white mb-4 text-sm">Escolha um plano para continuar</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => checkout('monthly')} disabled={checkoutLoading !== null}
              className="p-4 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 rounded-xl text-left transition-colors disabled:opacity-60">
              <p className="font-bold text-gray-900 dark:text-white">R$87<span className="text-xs font-normal text-gray-400">/mês</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Mensal</p>
              {checkoutLoading === 'monthly' && <Loader2 size={13} className="animate-spin mt-2 text-blue-400" />}
            </button>
            <button onClick={() => checkout('annual')} disabled={checkoutLoading !== null}
              className="p-4 border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500 rounded-xl text-left transition-colors disabled:opacity-60 relative">
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">MELHOR</div>
              <p className="font-bold text-gray-900 dark:text-white">R$925<span className="text-xs font-normal text-gray-400">/ano</span></p>
              <p className="text-xs text-gray-400 mt-0.5">≈ R$77/mês</p>
              {checkoutLoading === 'annual' && <Loader2 size={13} className="animate-spin mt-2 text-blue-400" />}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 justify-center">
        <BarChart2 size={12} className="text-blue-400" />
        Pagamentos processados com segurança pelo Stripe
      </div>
    </div>
  )
}
