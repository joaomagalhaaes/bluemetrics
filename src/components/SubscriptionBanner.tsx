'use client'

import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'

interface Props {
  type: 'trial_warning' | 'grace_warning'
  daysLeft: number
}

export default function SubscriptionBanner({ type, daysLeft }: Props) {
  if (type === 'trial_warning') {
    return (
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <Clock size={15} />
          <span>
            {daysLeft <= 1
              ? 'Seu trial termina hoje!'
              : `${daysLeft} dias restantes no trial gratuito.`}
            {' '}Adicione um cartão para não perder o acesso.
          </span>
        </div>
        <Link href="/dashboard/billing"
          className="bg-white text-blue-600 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          Assinar agora
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} />
        <span>
          Pagamento pendente.{' '}
          {daysLeft <= 0
            ? 'Sua conta será pausada em breve.'
            : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} para regularizar antes de ser pausada.`}
        </span>
      </div>
      <Link href="/dashboard/billing"
        className="bg-white text-amber-600 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors whitespace-nowrap">
        Atualizar cartão
      </Link>
    </div>
  )
}
