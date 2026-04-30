import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const META_API = 'https://graph.facebook.com/v21.0'

const INSIGHT_FIELDS = [
  'campaign_name',
  'adset_name',
  'ad_name',
  'objective',
  'impressions',
  'reach',
  'clicks',
  'cpc',
  'cpm',
  'ctr',
  'spend',
  'frequency',
  'actions',
  'cost_per_action_type',
].join(',')

interface MetaAction {
  action_type: string
  value: string
}

function extractAction(actions: MetaAction[] | undefined, type: string): number {
  const a = actions?.find(a => a.action_type === type)
  return a ? parseFloat(a.value) : 0
}

function extractCost(costs: MetaAction[] | undefined, type: string): number {
  const a = costs?.find(a => a.action_type === type)
  return a ? parseFloat(a.value) : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInsight(row: any) {
  const actions = row.actions as MetaAction[] | undefined
  const costs   = row.cost_per_action_type as MetaAction[] | undefined

  return {
    // Métricas de entrega (sempre presentes)
    alcance: parseInt(row.reach ?? '0'),
    impressoes: parseInt(row.impressions ?? '0'),
    frequencia: parseFloat(row.frequency ?? '0'),

    // Cliques
    cliquesNoLink: extractAction(actions, 'link_click'),
    cliquesTotais: parseInt(row.clicks ?? '0'),
    ctr: parseFloat(row.ctr ?? '0'),
    cpc: parseFloat(row.cpc ?? '0'),
    cpm: parseFloat(row.cpm ?? '0'),

    // Investimento
    valorGasto: parseFloat(row.spend ?? '0'),

    // Conversas (WhatsApp/Messenger)
    conversasIniciadas: extractAction(actions, 'onsite_conversion.messaging_conversation_started_7d'),
    custoPorConversa: extractCost(costs, 'onsite_conversion.messaging_conversation_started_7d'),

    // Leads
    leads: extractAction(actions, 'lead') + extractAction(actions, 'offsite_conversion.fb_pixel_lead'),
    custoPorLead: extractCost(costs, 'lead') || extractCost(costs, 'offsite_conversion.fb_pixel_lead'),

    // Compras / vendas
    compras: extractAction(actions, 'offsite_conversion.fb_pixel_purchase') + extractAction(actions, 'purchase'),
    custoPorCompra: extractCost(costs, 'offsite_conversion.fb_pixel_purchase') || extractCost(costs, 'purchase'),

    // Adição ao carrinho
    adicionouAoCarrinho: extractAction(actions, 'offsite_conversion.fb_pixel_add_to_cart'),

    // Cadastros / iniciou checkout
    iniciouCheckout: extractAction(actions, 'offsite_conversion.fb_pixel_initiate_checkout'),

    // Visualização de página
    visualizouPagina: extractAction(actions, 'offsite_conversion.fb_pixel_view_content'),

    // Engajamento
    curtidas: extractAction(actions, 'post_reaction'),
    comentarios: extractAction(actions, 'comment'),
    compartilhamentos: extractAction(actions, 'post'),
    salvamentos: extractAction(actions, 'onsite_conversion.post_save'),

    // Vídeo
    reproducoes: extractAction(actions, 'video_view'),
  }
}

// Dados demo
function getMockCampaigns() {
  const base = {
    alcance: 0, impressoes: 0, frequencia: 0,
    cliquesNoLink: 0, cliquesTotais: 0, ctr: 0, cpc: 0, cpm: 0,
    valorGasto: 0,
    conversasIniciadas: 0, custoPorConversa: 0,
    leads: 0, custoPorLead: 0,
    compras: 0, custoPorCompra: 0,
    adicionouAoCarrinho: 0, iniciouCheckout: 0, visualizouPagina: 0,
    curtidas: 0, comentarios: 0, compartilhamentos: 0, salvamentos: 0,
    reproducoes: 0,
  }
  return [
    {
      id: 'c1', name: 'Campanha Vendas - Loja Online', status: 'ACTIVE', objective: 'OUTCOME_SALES',
      metrics: { ...base, alcance: 14200, impressoes: 38500, frequencia: 2.7, cliquesNoLink: 1680, cliquesTotais: 2100, ctr: 5.45, cpc: 1.38, cpm: 17.40, valorGasto: 2890.00, conversasIniciadas: 45, custoPorConversa: 14.20, leads: 28, custoPorLead: 22.50, compras: 42, custoPorCompra: 68.81, adicionouAoCarrinho: 95, iniciouCheckout: 58, visualizouPagina: 320 },
      adsets: [
        {
          id: 'as1', name: 'Mulheres 25-45 · São Paulo', status: 'ACTIVE',
          metrics: { ...base, alcance: 7800, impressoes: 21000, frequencia: 2.7, cliquesNoLink: 980, cliquesTotais: 1200, ctr: 5.71, cpc: 1.30, cpm: 16.80, valorGasto: 1580.00, compras: 26, custoPorCompra: 60.77, adicionouAoCarrinho: 58, iniciouCheckout: 35, visualizouPagina: 190 },
          ads: [
            { id: 'ad1', name: 'Carrossel - Coleção Verão', status: 'ACTIVE', metrics: { ...base, alcance: 4500, impressoes: 12500, frequencia: 2.8, cliquesNoLink: 600, cliquesTotais: 740, ctr: 5.92, cpc: 1.22, cpm: 16.20, valorGasto: 920.00, compras: 16, custoPorCompra: 57.50, adicionouAoCarrinho: 35, iniciouCheckout: 22, visualizouPagina: 115 } },
            { id: 'ad2', name: 'Vídeo - Depoimento Cliente', status: 'ACTIVE', metrics: { ...base, alcance: 3300, impressoes: 8500, frequencia: 2.6, cliquesNoLink: 380, cliquesTotais: 460, ctr: 5.41, cpc: 1.43, cpm: 17.60, valorGasto: 660.00, compras: 10, custoPorCompra: 66.00, adicionouAoCarrinho: 23, iniciouCheckout: 13, visualizouPagina: 75, reproducoes: 2800 } },
          ]
        },
        {
          id: 'as2', name: 'Homens 30-50 · Rio de Janeiro', status: 'ACTIVE',
          metrics: { ...base, alcance: 6400, impressoes: 17500, frequencia: 2.7, cliquesNoLink: 700, cliquesTotais: 900, ctr: 5.14, cpc: 1.48, cpm: 18.10, valorGasto: 1310.00, compras: 16, custoPorCompra: 81.88, adicionouAoCarrinho: 37, iniciouCheckout: 23, visualizouPagina: 130 },
          ads: [
            { id: 'ad3', name: 'Imagem - Oferta Especial 20%', status: 'ACTIVE', metrics: { ...base, alcance: 3600, impressoes: 9800, frequencia: 2.7, cliquesNoLink: 420, cliquesTotais: 530, ctr: 5.41, cpc: 1.40, cpm: 17.50, valorGasto: 750.00, compras: 10, custoPorCompra: 75.00, adicionouAoCarrinho: 22, iniciouCheckout: 14, visualizouPagina: 78 } },
            { id: 'ad4', name: 'Story - Promoção Relâmpago', status: 'PAUSED', metrics: { ...base, alcance: 2800, impressoes: 7700, frequencia: 2.8, cliquesNoLink: 280, cliquesTotais: 370, ctr: 4.81, cpc: 1.60, cpm: 18.80, valorGasto: 560.00, compras: 6, custoPorCompra: 93.33, adicionouAoCarrinho: 15, iniciouCheckout: 9, visualizouPagina: 52 } },
          ]
        },
      ]
    },
    {
      id: 'c2', name: 'Campanha WhatsApp - Atendimento', status: 'ACTIVE', objective: 'OUTCOME_ENGAGEMENT',
      metrics: { ...base, alcance: 9500, impressoes: 22800, frequencia: 2.4, cliquesNoLink: 1420, cliquesTotais: 1680, ctr: 7.37, cpc: 0.89, cpm: 13.80, valorGasto: 1490.00, conversasIniciadas: 238, custoPorConversa: 6.26, leads: 72 },
      adsets: [
        {
          id: 'as3', name: 'Lookalike Clientes · Brasil', status: 'ACTIVE',
          metrics: { ...base, alcance: 5600, impressoes: 13500, frequencia: 2.4, cliquesNoLink: 880, cliquesTotais: 1020, ctr: 7.56, cpc: 0.84, cpm: 13.20, valorGasto: 860.00, conversasIniciadas: 148, custoPorConversa: 5.81, leads: 45 },
          ads: [
            { id: 'ad5', name: 'CTA - Fale Conosco WhatsApp', status: 'ACTIVE', metrics: { ...base, alcance: 5600, impressoes: 13500, frequencia: 2.4, cliquesNoLink: 880, cliquesTotais: 1020, ctr: 7.56, cpc: 0.84, cpm: 13.20, valorGasto: 860.00, conversasIniciadas: 148, custoPorConversa: 5.81, leads: 45 } },
          ]
        },
        {
          id: 'as4', name: 'Interesse Moda · SP e RJ', status: 'ACTIVE',
          metrics: { ...base, alcance: 3900, impressoes: 9300, frequencia: 2.4, cliquesNoLink: 540, cliquesTotais: 660, ctr: 7.10, cpc: 0.95, cpm: 14.50, valorGasto: 630.00, conversasIniciadas: 90, custoPorConversa: 7.00, leads: 27 },
          ads: [
            { id: 'ad6', name: 'Vídeo - Bastidores da Loja', status: 'ACTIVE', metrics: { ...base, alcance: 3900, impressoes: 9300, frequencia: 2.4, cliquesNoLink: 540, cliquesTotais: 660, ctr: 7.10, cpc: 0.95, cpm: 14.50, valorGasto: 630.00, conversasIniciadas: 90, custoPorConversa: 7.00, leads: 27, reproducoes: 3200 } },
          ]
        },
      ]
    },
    {
      id: 'c3', name: 'Remarketing - Carrinho Abandonado', status: 'PAUSED', objective: 'OUTCOME_SALES',
      metrics: { ...base, alcance: 3400, impressoes: 10200, frequencia: 3.0, cliquesNoLink: 720, cliquesTotais: 850, ctr: 8.33, cpc: 0.76, cpm: 11.80, valorGasto: 650.00, compras: 34, custoPorCompra: 19.12, adicionouAoCarrinho: 12, iniciouCheckout: 8, visualizouPagina: 280 },
      adsets: [
        {
          id: 'as5', name: 'Visitou o site nos últimos 7 dias', status: 'PAUSED',
          metrics: { ...base, alcance: 3400, impressoes: 10200, frequencia: 3.0, cliquesNoLink: 720, cliquesTotais: 850, ctr: 8.33, cpc: 0.76, cpm: 11.80, valorGasto: 650.00, compras: 34, custoPorCompra: 19.12, adicionouAoCarrinho: 12, iniciouCheckout: 8, visualizouPagina: 280 },
          ads: [
            { id: 'ad7', name: 'Carrossel - Produtos que você viu', status: 'PAUSED', metrics: { ...base, alcance: 2000, impressoes: 6100, frequencia: 3.1, cliquesNoLink: 440, cliquesTotais: 520, ctr: 8.52, cpc: 0.72, cpm: 11.40, valorGasto: 380.00, compras: 22, custoPorCompra: 17.27, adicionouAoCarrinho: 8, iniciouCheckout: 5, visualizouPagina: 170 } },
            { id: 'ad8', name: 'Imagem - Cupom 10% de desconto', status: 'PAUSED', metrics: { ...base, alcance: 1400, impressoes: 4100, frequencia: 2.9, cliquesNoLink: 280, cliquesTotais: 330, ctr: 8.05, cpc: 0.82, cpm: 12.40, valorGasto: 270.00, compras: 12, custoPorCompra: 22.50, adicionouAoCarrinho: 4, iniciouCheckout: 3, visualizouPagina: 110 } },
          ]
        },
      ]
    },
  ]
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('clientId')
  const datePreset = req.nextUrl.searchParams.get('datePreset') ?? 'last_30d'

  let client = null
  if (clientId) {
    client = await prisma.client.findFirst({ where: { id: clientId, userId: session.userId } })
  } else {
    // Busca o client mais recente que TEM token
    client = await prisma.client.findFirst({
      where: { userId: session.userId, accessToken: { not: null } },
      orderBy: { createdAt: 'desc' },
    })
    // Fallback: qualquer client
    if (!client) client = await prisma.client.findFirst({ where: { userId: session.userId } })
  }

  if (!client?.accessToken || !client?.adAccountId) {
    return NextResponse.json({ demo: true, campaigns: getMockCampaigns() })
  }

  // Remove 'act_' se o usuário colocou na frente
  const adAccountId = client.adAccountId.replace(/^act_/, '')

  try {
    const campRes = await fetch(
      `${META_API}/act_${adAccountId}/campaigns?fields=name,status,objective&access_token=${client.accessToken}`
    )
    const campData = await campRes.json()
    if (campData.error) {
      console.error('Meta campaigns error:', campData.error)
      throw new Error(campData.error.message)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaigns = await Promise.all((campData.data ?? []).map(async (camp: any) => {
      const insRes = await fetch(
        `${META_API}/${camp.id}/insights?fields=${INSIGHT_FIELDS}&date_preset=${datePreset}&access_token=${client.accessToken}`
      )
      const insData = await insRes.json()
      const campMetrics = insData.data?.[0] ? mapInsight(insData.data[0]) : null

      const asRes = await fetch(
        `${META_API}/${camp.id}/adsets?fields=name,status&access_token=${client.accessToken}`
      )
      const asData = await asRes.json()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adsets = await Promise.all((asData.data ?? []).map(async (adset: any) => {
        const asInsRes = await fetch(
          `${META_API}/${adset.id}/insights?fields=${INSIGHT_FIELDS}&date_preset=${datePreset}&access_token=${client.accessToken}`
        )
        const asInsData = await asInsRes.json()
        const asMetrics = asInsData.data?.[0] ? mapInsight(asInsData.data[0]) : null

        const adRes = await fetch(
          `${META_API}/${adset.id}/ads?fields=name,status&access_token=${client.accessToken}`
        )
        const adData = await adRes.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ads = await Promise.all((adData.data ?? []).map(async (ad: any) => {
          const adInsRes = await fetch(
            `${META_API}/${ad.id}/insights?fields=${INSIGHT_FIELDS}&date_preset=${datePreset}&access_token=${client.accessToken}`
          )
          const adInsData = await adInsRes.json()
          return { id: ad.id, name: ad.name, status: ad.status, metrics: adInsData.data?.[0] ? mapInsight(adInsData.data[0]) : null }
        }))

        return { id: adset.id, name: adset.name, status: adset.status, metrics: asMetrics, ads }
      }))

      return { id: camp.id, name: camp.name, status: camp.status, objective: camp.objective, metrics: campMetrics, adsets }
    }))

    return NextResponse.json({ demo: false, campaigns })
  } catch (e) {
    console.error('Meta campaigns error:', e)
    return NextResponse.json({ demo: true, campaigns: getMockCampaigns() })
  }
}
