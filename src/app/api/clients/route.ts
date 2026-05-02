import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      name: true,
      adAccountId: true,
      // Retorna apenas se TEM token (sem expor o valor real)
      accessToken: false,
      appId: false,
      appSecret: false,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Adiciona flag indicando se tem token configurado
  const safe = clients.map(c => ({
    ...c,
    hasToken: false, // será preenchido abaixo
  }))

  // Busca separado quais têm token
  const withToken = await prisma.client.findMany({
    where: { userId: session.userId, accessToken: { not: null } },
    select: { id: true },
  })
  const tokenIds = new Set(withToken.map(c => c.id))
  safe.forEach(c => { c.hasToken = tokenIds.has(c.id) })

  return NextResponse.json(safe)
}

// GET completo para página de configuração (com dados sensíveis mascarados)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  // Ação especial: buscar detalhes de um client (com token mascarado)
  if (action === 'details') {
    const client = await prisma.client.findFirst({
      where: { id: body.id, userId: session.userId },
    })
    if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json({
      ...client,
      accessToken: client.accessToken ? `${client.accessToken.slice(0, 10)}...${client.accessToken.slice(-4)}` : null,
      appSecret: client.appSecret ? '••••••••' : null,
    })
  }

  // Criar novo client
  const { name, adAccountId, accessToken, appId, appSecret } = body
  if (!name || !adAccountId) {
    return NextResponse.json({ error: 'Nome e Ad Account ID são obrigatórios' }, { status: 400 })
  }

  const client = await prisma.client.create({
    data: {
      name,
      adAccountId,
      accessToken: accessToken || null,
      appId: appId || null,
      appSecret: appSecret || null,
      userId: session.userId,
    },
  })
  return NextResponse.json({ id: client.id, name: client.name, adAccountId: client.adAccountId, hasToken: !!client.accessToken, createdAt: client.createdAt })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, name, adAccountId, accessToken, appId, appSecret } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (adAccountId !== undefined) data.adAccountId = adAccountId
  if (accessToken !== undefined) data.accessToken = accessToken || null
  if (appId !== undefined) data.appId = appId || null
  if (appSecret !== undefined) data.appSecret = appSecret || null

  await prisma.client.updateMany({ where: { id, userId: session.userId }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.client.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
