import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { addBusinessDays } from '@/lib/subscription'
import type Stripe from 'stripe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStripeInvoice = any

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan ?? null
        if (!userId) break

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: 'active',
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
          update: {
            status: 'active',
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            gracePeriodEnd: null,
            suspendedAt: null,
          },
        })
        console.log(`[billing] Assinatura ativada para userId=${userId}, plano=${plan}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as AnyStripeInvoice
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null
        if (!subscriptionId) break

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: String(subscriptionId) },
        })
        if (!sub) break

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'active',
            currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            gracePeriodEnd: null,
            suspendedAt: null,
          },
        })
        console.log(`[billing] Pagamento confirmado, sub=${sub.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as AnyStripeInvoice
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null
        if (!subscriptionId) break

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: String(subscriptionId) },
        })
        if (!sub) break

        const gracePeriodEnd = addBusinessDays(new Date(), 5)

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'grace', gracePeriodEnd },
        })
        console.log(`[billing] Pagamento falhou — período de graça até ${gracePeriodEnd.toISOString()}, sub=${sub.id}`)
        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stripeSub = event.data.object as any
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        })
        if (!sub) break

        const status = stripeSub.status === 'active' ? 'active'
          : stripeSub.status === 'trialing' ? 'trial'
          : stripeSub.status === 'past_due' ? 'grace'
          : stripeSub.status === 'canceled' ? 'cancelled'
          : sub.status

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status,
            currentPeriodEnd: stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000)
              : null,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        })
        if (!sub) break

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'cancelled' },
        })
        console.log(`[billing] Assinatura cancelada, sub=${sub.id}`)
        break
      }
    }
  } catch (err) {
    console.error(`[billing] Erro processando evento ${event.type}:`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
