import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

    const client = await prisma.client.findFirst({
      where: { id: clientId },
      select: { adAccountId: true, accessToken: true, name: true, pixelId: true },
    })

    if (!client || !client.accessToken) {
      return NextResponse.json({
        pixels: [],
        status: 'NO_TOKEN',
        message: 'Token de acesso não configurado para esta conta.',
      })
    }

    const accId = client.adAccountId.replace(/^act_/, '')

    // Busca pixels da conta
    const pixelRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accId}/adspixels?fields=id,name,code,last_fired_time,is_unavailable,creation_time&access_token=${client.accessToken}`
    )
    const pixelData = await pixelRes.json()

    if (!pixelRes.ok || pixelData.error) {
      return NextResponse.json({
        pixels: [],
        status: 'API_ERROR',
        message: pixelData.error?.message ?? 'Erro ao buscar pixels',
      })
    }

    const pixels = (pixelData.data ?? []).map((px: Record<string, unknown>) => ({
      id: px.id,
      name: px.name,
      lastFiredTime: px.last_fired_time ?? null,
      isUnavailable: px.is_unavailable ?? false,
      creationTime: px.creation_time ?? null,
      code: px.code ?? null,
    }))

    // Busca eventos de pixel dos últimos 30 dias
    let pixelEvents: Record<string, number> = {}
    // Busca breakdown por criativo (ad_name) para diagnóstico
    let creativeBreakdown: Array<{ adName: string; impressions: number; clicks: number; ctr: number; conversions: number; spend: number; costPerResult: number }> = []

    try {
      const insRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${accId}/insights?fields=actions&date_preset=last_30d&access_token=${client.accessToken}`
      )
      const insData = await insRes.json()
      const actions: Array<{ action_type: string; value: string }> = insData.data?.[0]?.actions ?? []

      for (const a of actions) {
        pixelEvents[a.action_type] = parseInt(a.value)
      }
    } catch {
      // ignora erro de insights
    }

    // Busca breakdown por criativo para diagnóstico de conversão
    try {
      const breakdownRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${accId}/insights?fields=ad_name,impressions,clicks,ctr,actions,spend,cost_per_action_type&date_preset=last_30d&level=ad&limit=20&access_token=${client.accessToken}`
      )
      const breakdownData = await breakdownRes.json()
      if (breakdownData.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        creativeBreakdown = breakdownData.data.map((ad: any) => {
          const actions: Array<{ action_type: string; value: string }> = ad.actions ?? []
          const costPerAction: Array<{ action_type: string; value: string }> = ad.cost_per_action_type ?? []
          const conversions = actions.find(a =>
            a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
            a.action_type === 'lead' ||
            a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
            a.action_type === 'purchase'
          )
          const costResult = costPerAction.find(a =>
            a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
            a.action_type === 'lead' ||
            a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
            a.action_type === 'purchase'
          )
          return {
            adName: ad.ad_name ?? 'Sem nome',
            impressions: parseInt(ad.impressions ?? '0'),
            clicks: parseInt(ad.clicks ?? '0'),
            ctr: parseFloat(ad.ctr ?? '0'),
            conversions: conversions ? parseInt(conversions.value) : 0,
            spend: parseFloat(ad.spend ?? '0'),
            costPerResult: costResult ? parseFloat(costResult.value) : 0,
          }
        })
      }
    } catch {
      // ignora erro de breakdown
    }

    return NextResponse.json({
      pixels,
      events: pixelEvents,
      creativeBreakdown,
      status: pixels.length > 0 ? 'OK' : 'NO_PIXEL',
      clientName: client.name,
      savedPixelId: client.pixelId ?? null,
    })
  } catch (err) {
    console.error('Pixels API error:', err)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
