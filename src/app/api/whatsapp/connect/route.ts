import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInstance, getEvolutionConfig, setInstanceWebhook, listAllInstances, getConnectionState } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbInstances = await prisma.whatsappInstance.findMany({ where: { userId: session.userId } })

  // Atualiza status de cada instância via Evolution API
  const { configured } = getEvolutionConfig()
  if (configured) {
    const updates = dbInstances.map(async (inst) => {
      const state = await getConnectionState(inst.instanceName)
      if (state !== 'unknown' && state !== inst.status) {
        await prisma.whatsappInstance.update({
          where: { id: inst.id },
          data: { status: state },
        })
        return { ...inst, status: state }
      }
      return inst
    })
    const updated = await Promise.all(updates)
    return NextResponse.json(updated)
  }

  return NextResponse.json(dbInstances)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'Nome da instância obrigatório' }, { status: 400 })

  // Checa se já existe no banco
  const existing = await prisma.whatsappInstance.findFirst({ where: { instanceName, userId: session.userId } })
  if (existing) return NextResponse.json(existing)

  const instance = await prisma.whatsappInstance.create({
    data: { instanceName, userId: session.userId, status: 'connecting' },
  })

  // Cria instância na Evolution API COM webhook já configurado
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bluemetrics-phi.vercel.app'}/api/whatsapp/webhook`
  const result = await createInstance(instanceName, webhookUrl)

  if (!result.ok) {
    console.warn(`[connect] Evolution create failed for "${instanceName}": ${result.error}`)
  }

  return NextResponse.json(instance)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  await prisma.whatsappInstance.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}

// Endpoint para sincronizar instâncias da Evolution API que existem lá mas não no banco
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const evoInstances = await listAllInstances()
  const dbInstances = await prisma.whatsappInstance.findMany({ where: { userId: session.userId } })
  const dbNames = new Set(dbInstances.map(i => i.instanceName.toLowerCase()))

  const created: string[] = []
  for (const evo of evoInstances) {
    if (!dbNames.has(evo.instanceName.toLowerCase())) {
      await prisma.whatsappInstance.create({
        data: {
          instanceName: evo.instanceName,
          userId: session.userId,
          status: evo.state === 'open' ? 'open' : 'connecting',
        },
      })
      created.push(evo.instanceName)
    }
  }

  return NextResponse.json({ synced: created, total: evoInstances.length })
}
