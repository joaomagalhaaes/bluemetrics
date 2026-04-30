import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const META_API = 'https://graph.facebook.com/v21.0'

const INSIGHT_FIELDS = [
  'campaign_name',
  'adset_name',
  'ad_name',
  'status',
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

function extractCostAction(costs: MetaAction[] | undefined, type: string): number {
  const a = costs?.find(a => a.action_type === type)
  return a ? parseFloat(a.value) : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInsight(row: any) {
  const actions = row.actions as MetaAction[] | undefined
  const costs   = row.cost_per_action_type as MetaAction[] | undefined

  const results = extractAction(actions, 'offsite_conversion.fb_pixel_lead')
    + extractAction(actions, 'lead')
    + extractAction(actions, 'onsite_conversion.messaging_conversation_started_7d')
    + extractAction(actions, 'offsite_conversion.fb_pixel_purchase')

  const costPerResult = results > 0 ? parseFloat(row.spend ?? '0') / results : 0
  const conversationsStarted = extractAction(actions, 'onsite_conversion.messaging_conversation_started_7d')
  const costPerConversation = extractCostAction(costs, 'onsite_conversion.messaging_conversation_started_7d')
  const leads = extractAction(actions, 'offsite_conversion.fb_pixel_lead') + extractAction(actions, 'lead')
  const purchases = extractAction(actions, 'offsite_conversion.fb_pixel_purchase')
  const linkClicks = extractAction(actions, 'link_click')

  return {
    pessoasAlcancadas: parseInt(row.reach ?? '0'),
    visualizacoes: parseInt(row.impressions ?? '0'),
    cliques: parseInt(row.clicks ?? '0'),
    cliquesNoLink: linkClicks,
    taxaDeCliques: parseFloat(row.ctr ?? '0'),
    custoPorClique: parseFloat(row.cpc ?? '0'),
    custoPorMilVisualizacoes: parseFloat(row.cpm ?? '0'),
    investimento: parseFloat(row.spend ?? '0'),
    frequencia: parseFloat(row.frequency ?? '0'),
    resultados: results,
    custoPorResultado: costPerResult,
    conversasIniciadas: conversationsStarted,
    custoPorConversa: costPerConversation,
    leads,
    compras: purchases,
  }
}

// Dados demo quando não tem token
function getMockCampaigns() {
  return [
    {
      id: 'c1', name: 'Campanha Vendas Verão', status: 'ACTIVE', objective: 'CONVERSIONS',
      metrics: { pessoasAlcancadas: 12450, visualizacoes: 34800, cliques: 1820, cliquesNoLink: 1540, taxaDeCliques: 5.23, custoPorClique: 1.42, custoPorMilVisualizacoes: 18.50, investimento: 2580.00, frequencia: 2.8, resultados: 142, custoPorResultado: 18.17, conversasIniciadas: 89, custoPorConversa: 12.50, leads: 142, compras: 38 },
      adsets: [
        { id: 'as1', name: 'Mulheres 25-45 SP', status: 'ACTIVE', metrics: { pessoasAlcancadas: 6200, visualizacoes: 18200, cliques: 980, cliquesNoLink: 820, taxaDeCliques: 5.38, custoPorClique: 1.35, custoPorMilVisualizacoes: 17.20, investimento: 1320.00, frequencia: 2.9, resultados: 82, custoPorResultado: 16.10, conversasIniciadas: 51, custoPorConversa: 11.80, leads: 82, compras: 22 },
          ads: [
            { id: 'ad1', name: 'Criativo Carrossel Produtos', status: 'ACTIVE', metrics: { pessoasAlcancadas: 3800, visualizacoes: 11400, cliques: 620, cliquesNoLink: 530, taxaDeCliques: 5.44, custoPorClique: 1.28, custoPorMilVisualizacoes: 16.50, investimento: 790.00, frequencia: 3.0, resultados: 52, custoPorResultado: 15.19, conversasIniciadas: 33, custoPorConversa: 11.20, leads: 52, compras: 14 } },
            { id: 'ad2', name: 'Vídeo Depoimento Cliente', status: 'ACTIVE', metrics: { pessoasAlcancadas: 2400, visualizacoes: 6800, cliques: 360, cliquesNoLink: 290, taxaDeCliques: 5.29, custoPorClique: 1.47, custoPorMilVisualizacoes: 18.40, investimento: 530.00, frequencia: 2.8, resultados: 30, custoPorResultado: 17.67, conversasIniciadas: 18, custoPorConversa: 12.80, leads: 30, compras: 8 } },
          ]
        },
        { id: 'as2', name: 'Homens 30-50 RJ', status: 'ACTIVE', metrics: { pessoasAlcancadas: 6250, visualizacoes: 16600, cliques: 840, cliquesNoLink: 720, taxaDeCliques: 5.06, custoPorClique: 1.50, custoPorMilVisualizacoes: 19.90, investimento: 1260.00, frequencia: 2.7, resultados: 60, custoPorResultado: 21.00, conversasIniciadas: 38, custoPorConversa: 13.40, leads: 60, compras: 16 },
          ads: [
            { id: 'ad3', name: 'Imagem Oferta Especial', status: 'ACTIVE', metrics: { pessoasAlcancadas: 3500, visualizacoes: 9200, cliques: 480, cliquesNoLink: 410, taxaDeCliques: 5.22, custoPorClique: 1.44, custoPorMilVisualizacoes: 19.10, investimento: 720.00, frequencia: 2.6, resultados: 35, custoPorResultado: 20.57, conversasIniciadas: 22, custoPorConversa: 13.00, leads: 35, compras: 9 } },
            { id: 'ad4', name: 'Story Promocional', status: 'PAUSED', metrics: { pessoasAlcancadas: 2750, visualizacoes: 7400, cliques: 360, cliquesNoLink: 310, taxaDeCliques: 4.86, custoPorClique: 1.58, custoPorMilVisualizacoes: 20.80, investimento: 540.00, frequencia: 2.7, resultados: 25, custoPorResultado: 21.60, conversasIniciadas: 16, custoPorConversa: 14.00, leads: 25, compras: 7 } },
          ]
        },
      ]
    },
    {
      id: 'c2', name: 'Campanha Leads WhatsApp', status: 'ACTIVE', objective: 'MESSAGES',
      metrics: { pessoasAlcancadas: 8900, visualizacoes: 21500, cliques: 1340, cliquesNoLink: 1180, taxaDeCliques: 6.23, custoPorClique: 0.98, custoPorMilVisualizacoes: 14.20, investimento: 1310.00, frequencia: 2.4, resultados: 210, custoPorResultado: 6.24, conversasIniciadas: 210, custoPorConversa: 6.24, leads: 65, compras: 0 },
      adsets: [
        { id: 'as3', name: 'Lookalike Clientes', status: 'ACTIVE', metrics: { pessoasAlcancadas: 5200, visualizacoes: 12800, cliques: 820, cliquesNoLink: 720, taxaDeCliques: 6.41, custoPorClique: 0.92, custoPorMilVisualizacoes: 13.50, investimento: 760.00, frequencia: 2.5, resultados: 128, custoPorResultado: 5.94, conversasIniciadas: 128, custoPorConversa: 5.94, leads: 40, compras: 0 },
          ads: [
            { id: 'ad5', name: 'CTA WhatsApp Direto', status: 'ACTIVE', metrics: { pessoasAlcancadas: 5200, visualizacoes: 12800, cliques: 820, cliquesNoLink: 720, taxaDeCliques: 6.41, custoPorClique: 0.92, custoPorMilVisualizacoes: 13.50, investimento: 760.00, frequencia: 2.5, resultados: 128, custoPorResultado: 5.94, conversasIniciadas: 128, custoPorConversa: 5.94, leads: 40, compras: 0 } },
          ]
        },
        { id: 'as4', name: 'Interesse Moda Feminina', status: 'ACTIVE', metrics: { pessoasAlcancadas: 3700, visualizacoes: 8700, cliques: 520, cliquesNoLink: 460, taxaDeCliques: 5.98, custoPorClique: 1.06, custoPorMilVisualizacoes: 15.20, investimento: 550.00, frequencia: 2.4, resultados: 82, custoPorResultado: 6.71, conversasIniciadas: 82, custoPorConversa: 6.71, leads: 25, compras: 0 },
          ads: [
            { id: 'ad6', name: 'Vídeo Bastidores Loja', status: 'ACTIVE', metrics: { pessoasAlcancadas: 3700, visualizacoes: 8700, cliques: 520, cliquesNoLink: 460, taxaDeCliques: 5.98, custoPorClique: 1.06, custoPorMilVisualizacoes: 15.20, investimento: 550.00, frequencia: 2.4, resultados: 82, custoPorResultado: 6.71, conversasIniciadas: 82, custoPorConversa: 6.71, leads: 25, compras: 0 } },
          ]
        },
      ]
    },
    {
      id: 'c3', name: 'Remarketing Carrinho', status: 'PAUSED', objective: 'CONVERSIONS',
      metrics: { pessoasAlcancadas: 3200, visualizacoes: 9800, cliques: 680, cliquesNoLink: 590, taxaDeCliques: 6.94, custoPorClique: 0.88, custoPorMilVisualizacoes: 12.30, investimento: 600.00, frequencia: 3.1, resultados: 45, custoPorResultado: 13.33, conversasIniciadas: 12, custoPorConversa: 8.50, leads: 15, compras: 30 },
      adsets: [
        { id: 'as5', name: 'Visitou Site 7 dias', status: 'PAUSED', metrics: { pessoasAlcancadas: 3200, visualizacoes: 9800, cliques: 680, cliquesNoLink: 590, taxaDeCliques: 6.94, custoPorClique: 0.88, custoPorMilVisualizacoes: 12.30, investimento: 600.00, frequencia: 3.1, resultados: 45, custoPorResultado: 13.33, conversasIniciadas: 12, custoPorConversa: 8.50, leads: 15, compras: 30 },
          ads: [
            { id: 'ad7', name: 'Lembrete de Carrinho', status: 'PAUSED', metrics: { pessoasAlcancadas: 1800, visualizacoes: 5600, cliques: 400, cliquesNoLink: 350, taxaDeCliques: 7.14, custoPorClique: 0.82, custoPorMilVisualizacoes: 11.80, investimento: 330.00, frequencia: 3.1, resultados: 28, custoPorResultado: 11.79, conversasIniciadas: 8, custoPorConversa: 7.90, leads: 8, compras: 20 } },
            { id: 'ad8', name: 'Desconto 10% Final', status: 'PAUSED', metrics: { pessoasAlcancadas: 1400, visualizacoes: 4200, cliques: 280, cliquesNoLink: 240, taxaDeCliques: 6.67, custoPorClique: 0.96, custoPorMilVisualizacoes: 13.00, investimento: 270.00, frequencia: 3.0, resultados: 17, custoPorResultado: 15.88, conversasIniciadas: 4, custoPorConversa: 9.50, leads: 7, compras: 10 } },
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

  // Busca client com token
  let client = null
  if (clientId) {
    client = await prisma.client.findFirst({ where: { id: clientId, userId: session.userId } })
  } else {
    client = await prisma.client.findFirst({ where: { userId: session.userId } })
  }

  if (!client?.accessToken || !client?.adAccountId) {
    return NextResponse.json({ demo: true, campaigns: getMockCampaigns() })
  }

  try {
    // Busca campanhas
    const campRes = await fetch(
      `${META_API}/act_${client.adAccountId}/campaigns?fields=name,status,objective&access_token=${client.accessToken}`
    )
    const campData = await campRes.json()
    if (campData.error) throw new Error(campData.error.message)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaigns = await Promise.all((campData.data ?? []).map(async (camp: any) => {
      // Insights da campanha
      const insRes = await fetch(
        `${META_API}/${camp.id}/insights?fields=${INSIGHT_FIELDS}&date_preset=${datePreset}&access_token=${client.accessToken}`
      )
      const insData = await insRes.json()
      const campMetrics = insData.data?.[0] ? mapInsight(insData.data[0]) : null

      // Busca adsets
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

        // Busca ads do adset
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
          const adMetrics = adInsData.data?.[0] ? mapInsight(adInsData.data[0]) : null
          return { id: ad.id, name: ad.name, status: ad.status, metrics: adMetrics }
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
