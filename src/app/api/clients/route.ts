import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { exchangeForLongLivedToken, isError } from '@/lib/meta-token'

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

  // Busca separado quais têm token e quando expira
  const withToken = await prisma.client.findMany({
    where: { userId: session.userId, accessToken: { not: null } },
    select: { id: true, tokenExpiresAt: true },
  })
  const tokenMap = new Map(withToken.map(c => [c.id, c.tokenExpiresAt]))

  const safe = clients.map(c => ({
    ...c,
    hasToken: tokenMap.has(c.id),
    tokenExpiresAt: tokenMap.get(c.id)?.toISOString() ?? null,
  }))

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

  // Tenta trocar para token de longa duração automaticamente
  let finalToken = accessToken || null
  let tokenExpiresAt: Date | null = null
  let tokenExchangeWarning: string | null = null

  if (finalToken && appId && appSecret) {
    const result = await exchangeForLongLivedToken(finalToken, appId, appSecret)
    if (!isError(result)) {
      finalToken = result.longLivedToken
      tokenExpiresAt = result.expiresAt
      console.log(`[clients] Token trocado para longa duração (expira em ${tokenExpiresAt.toISOString()})`)
    } else {
      tokenExchangeWarning = result.error
      console.warn(`[clients] Não foi possível trocar token: ${result.error}. Usando token original.`)
    }
  } else if (finalToken && (!appId || !appSecret)) {
    tokenExchangeWarning = 'Preencha App ID e App Secret para que o token dure 60 dias. Sem eles, o token expira em poucas horas.'
  }

  const client = await prisma.client.create({
    data: {
      name,
      adAccountId,
      accessToken: finalToken,
      appId: appId || null,
      appSecret: appSecret || null,
      tokenExpiresAt,
      userId: session.userId,
    },
  })
  return NextResponse.json({
    id: client.id,
    name: client.name,
    adAccountId: client.adAccountId,
    hasToken: !!client.accessToken,
    tokenExpiresAt: tokenExpiresAt?.toISOString() ?? null,
    tokenExchangeWarning,
    createdAt: client.createdAt,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, name, adAccountId, accessToken, appId, appSecret } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (adAccountId !== undefined) data.adAccountId = adAccountId
  if (appId !== undefined) data.appId = appId || null
  if (appSecret !== undefined) data.appSecret = appSecret || null

  let tokenExchangeWarning: string | null = null

  // Se está atualizando o token, tenta trocar para longa duração
  if (accessToken !== undefined) {
    let finalToken = accessToken || null
    let tokenExpiresAt: Date | null = null

    if (finalToken) {
      // Busca appId/appSecret do client (usa os novos se enviados, senão os existentes)
      const existing = await prisma.client.findFirst({
        where: { id, userId: session.userId },
        select: { appId: true, appSecret: true },
      })
      const effectiveAppId = appId ?? existing?.appId
      const effectiveAppSecret = appSecret ?? existing?.appSecret

      if (effectiveAppId && effectiveAppSecret) {
        const result = await exchangeForLongLivedToken(finalToken, effectiveAppId, effectiveAppSecret)
        if (!isError(result)) {
          finalToken = result.longLivedToken
          tokenExpiresAt = result.expiresAt
          console.log(`[clients] Token atualizado para longa duração (expira em ${tokenExpiresAt.toISOString()})`)
        } else {
          tokenExchangeWarning = result.error
          console.warn(`[clients] Não foi possível trocar token: ${result.error}`)
        }
      } else {
        tokenExchangeWarning = 'Preencha App ID e App Secret para que o token dure 60 dias.'
      }
    }

    data.accessToken = finalToken
    data.tokenExpiresAt = tokenExpiresAt
  }

  await prisma.client.updateMany({ where: { id, userId: session.userId }, data })
  return NextResponse.json({ ok: true, tokenExchangeWarning })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.client.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
