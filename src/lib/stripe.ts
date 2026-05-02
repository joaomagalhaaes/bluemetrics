import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

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
