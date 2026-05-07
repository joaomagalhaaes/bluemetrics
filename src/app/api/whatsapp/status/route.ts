import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getConnectionState, setInstanceWebhook } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instanceName = req.nextUrl.searchParams.get('instance')
  if (!instanceName) return NextResponse.json({ error: 'instance obrigatório' }, { status: 400 })

  const state = await getConnectionState(instanceName)

  // Atualiza status no banco
  const instance = await prisma.whatsappInstance.findFirst({
    where: { instanceName, userId: session.userId },
  })

  if (instance) {
    const previousStatus = instance.status

    await prisma.whatsappInstance.update({
      where: { id: instance.id },
      data: { status: state },
    })

    // Se acabou de conectar (status mudou para open), configura webhook automaticamente!
    if (state === 'open' && previousStatus !== 'open') {
      console.log(`[status] Instance "${instanceName}" just connected! Auto-setting webhook...`)
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bluemetrics-phi.vercel.app'}/api/whatsapp/webhook`
      const result = await setInstanceWebhook(instanceName, webhookUrl)
      if (result.ok) {
        console.log(`[status] Webhook auto-configured for "${instanceName}"`)
        return NextResponse.json({ state, webhookSet: true })
      } else {
        console.warn(`[status] Failed to auto-set webhook for "${instanceName}": ${result.error}`)
        return NextResponse.json({ state, webhookSet: false, webhookError: result.error })
      }
    }
  }

  return NextResponse.json({ state })
}
