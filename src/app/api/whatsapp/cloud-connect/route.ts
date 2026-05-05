import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — Conectar número via WhatsApp Cloud API
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { phoneNumberId, waBusinessId, cloudApiToken, phone, instanceName } = await req.json()

  if (!phoneNumberId || !cloudApiToken) {
    return NextResponse.json(
      { error: 'Phone Number ID e Access Token são obrigatórios' },
      { status: 400 },
    )
  }

  // Verifica se o token funciona fazendo uma chamada de teste
  try {
    const testRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      { headers: { Authorization: `Bearer ${cloudApiToken}` } },
    )
    if (!testRes.ok) {
      const err = await testRes.json()
      return NextResponse.json(
        { error: `Token inválido ou Phone Number ID incorreto: ${err.error?.message || 'erro desconhecido'}` },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível validar o token com a API da Meta' },
      { status: 500 },
    )
  }

  // Verifica se já existe instância com esse phoneNumberId
  const existing = await prisma.whatsappInstance.findFirst({
    where: { phoneNumberId, userId: session.userId },
  })

  if (existing) {
    // Atualiza token e dados
    const updated = await prisma.whatsappInstance.update({
      where: { id: existing.id },
      data: {
        cloudApiToken,
        waBusinessId: waBusinessId || existing.waBusinessId,
        phone: phone || existing.phone,
        instanceName: instanceName || existing.instanceName,
        status: 'connected',
      },
    })
    return NextResponse.json({ ...updated, cloudApiToken: undefined, message: 'Instância atualizada' })
  }

  // Cria nova instância Cloud API
  const instance = await prisma.whatsappInstance.create({
    data: {
      instanceName: instanceName || `cloud-${phoneNumberId.slice(-4)}`,
      phone: phone || '',
      phoneNumberId,
      waBusinessId: waBusinessId || '',
      cloudApiToken,
      provider: 'cloud_api',
      status: 'connected',
      userId: session.userId,
    },
  })

  return NextResponse.json({ ...instance, cloudApiToken: undefined })
}

// GET — Lista instâncias Cloud API do usuário
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instances = await prisma.whatsappInstance.findMany({
    where: { userId: session.userId, provider: 'cloud_api' },
    select: {
      id: true,
      instanceName: true,
      phone: true,
      phoneNumberId: true,
      waBusinessId: true,
      status: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(instances)
}

// DELETE — Remove instância Cloud API
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  await prisma.whatsappInstance.deleteMany({
    where: { id, userId: session.userId, provider: 'cloud_api' },
  })

  return NextResponse.json({ ok: true })
}
