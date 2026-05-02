import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bluemetrics-phi.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { plan } = await req.json() as { plan: PlanKey }
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, name: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const sub = await prisma.subscription.findUnique({ where: { userId: session.userId } })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: sub?.stripeCustomerId ?? undefined,
      customer_email: sub?.stripeCustomerId ? undefined : user.email,
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: sub?.status === 'trial' ? 0 : undefined,
        metadata: { userId: session.userId, plan },
      },
      metadata: { userId: session.userId, plan },
      success_url: `${APP_URL}/dashboard/billing?success=1&plan=${plan}`,
      cancel_url: `${APP_URL}/billing?cancelled=1`,
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
