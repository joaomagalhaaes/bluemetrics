import Stripe from 'stripe'

// Lazy init: evita crash no build quando STRIPE_SECRET_KEY não está definida
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY não configurada')
    _stripe = new Stripe(key, {
      // @ts-expect-error — Stripe SDK version may not match typed API version
      apiVersion: '2024-06-20',
    })
  }
  return _stripe
}

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: 'Mensal',
    price: 87,
    period: 'mês',
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL!,
    name: 'Anual',
    price: 925,
    period: 'ano',
    monthlyEquiv: 77.08,
  },
} as const

export type PlanKey = keyof typeof PLANS
