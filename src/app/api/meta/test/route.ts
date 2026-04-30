import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Rota de diagnóstico — testa a conexão com a Meta API
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Busca o client com token
  const client = await prisma.client.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })

  if (!client) {
    return NextResponse.json({
      status: 'NO_CLIENT',
      message: 'Nenhuma conta cadastrada. Vá em "Minha Conta" e adicione.',
    })
  }

  if (!client.accessToken) {
    return NextResponse.json({
      status: 'NO_TOKEN',
      message: 'Conta encontrada mas sem token de acesso.',
      client: { name: client.name, adAccountId: client.adAccountId },
    })
  }

  const results: Record<string, unknown> = {
    status: 'TESTING',
    client: { name: client.name, adAccountId: client.adAccountId },
    tokenPreview: client.accessToken.slice(0, 20) + '...',
  }

  // Teste 1: Verificar o token
  try {
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${client.accessToken}`)
    const meData = await meRes.json()
    results.test1_token = { ok: meRes.ok, data: meData }
  } catch (e) {
    results.test1_token = { ok: false, error: String(e) }
  }

  // Teste 2: Verificar acesso à conta de anúncios
  try {
    const accId = client.adAccountId.replace(/^act_/, '')
    const accRes = await fetch(`https://graph.facebook.com/v21.0/act_${accId}?fields=name,account_status,currency,timezone_name&access_token=${client.accessToken}`)
    const accData = await accRes.json()
    results.test2_adAccount = { ok: accRes.ok, data: accData }
  } catch (e) {
    results.test2_adAccount = { ok: false, error: String(e) }
  }

  // Teste 3: Buscar campanhas
  try {
    const accId = client.adAccountId.replace(/^act_/, '')
    const campRes = await fetch(`https://graph.facebook.com/v21.0/act_${accId}/campaigns?fields=name,status,objective&limit=5&access_token=${client.accessToken}`)
    const campData = await campRes.json()
    results.test3_campaigns = { ok: campRes.ok, count: campData.data?.length ?? 0, data: campData }
  } catch (e) {
    results.test3_campaigns = { ok: false, error: String(e) }
  }

  // Teste 4: Buscar insights
  try {
    const accId = client.adAccountId.replace(/^act_/, '')
    const insRes = await fetch(`https://graph.facebook.com/v21.0/act_${accId}/insights?fields=spend,impressions,reach,clicks&date_preset=last_7d&access_token=${client.accessToken}`)
    const insData = await insRes.json()
    results.test4_insights = { ok: insRes.ok, data: insData }
  } catch (e) {
    results.test4_insights = { ok: false, error: String(e) }
  }

  // Diagnóstico
  const t1ok = (results.test1_token as { ok: boolean })?.ok
  const t2ok = (results.test2_adAccount as { ok: boolean })?.ok
  const t3ok = (results.test3_campaigns as { ok: boolean })?.ok
  const t4ok = (results.test4_insights as { ok: boolean })?.ok

  if (!t1ok) {
    results.diagnostico = '❌ Token inválido ou expirado. Gere um novo no Graph API Explorer.'
  } else if (!t2ok) {
    results.diagnostico = '❌ Token válido, mas sem acesso à conta de anúncios. Verifique o ID da conta e as permissões (ads_read).'
  } else if (!t3ok) {
    results.diagnostico = '❌ Acesso à conta OK, mas não conseguiu listar campanhas. Verifique permissão ads_read.'
  } else if (!t4ok) {
    results.diagnostico = '❌ Campanhas OK, mas falhou ao buscar métricas. Pode ser que não tenha gastos no período.'
  } else {
    results.diagnostico = '✅ Tudo funcionando! Token, conta e métricas OK.'
  }

  return NextResponse.json(results)
}
