// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CoreMetrics {
  spend: number
  impressions: number
  clicks: number
  uniqueClicks: number
  cpc: number
  cpm: number
  cpp: number          // custo por pessoa alcançada
  ctr: number
  uniqueCtr: number
  reach: number
  frequency: number
}

export interface ConversionMetrics {
  conversions: number
  costPerConversion: number
  roas: number
  purchases: number
  purchaseValue: number
  leads: number
  costPerLead: number
  addToCart: number
  initiateCheckout: number
  viewContent: number
  completeRegistration: number
}

export interface MessageMetrics {
  conversationsStarted: number   // WhatsApp / Messenger
  costPerConversation: number
  messagingReplies: number
  newMessagingConnections: number
}

export interface VideoMetrics {
  videoPlays: number
  video25Pct: number
  video50Pct: number
  video75Pct: number
  video100Pct: number
  avgWatchTime: number            // segundos
  costPerThruplay: number
  thruplayWatched: number
}

export interface EngagementMetrics {
  postEngagements: number
  pageEngagements: number
  reactions: number
  comments: number
  shares: number
  pageLikes: number
  postSaves: number
  linkClicks: number
}

export interface PixelMetrics {
  pixelFires: number
  pixelPurchases: number
  pixelLeads: number
  pixelAddToCart: number
  pixelInitiateCheckout: number
  pixelCompleteRegistration: number
  pixelViewContent: number
  pixelSearches: number
  pixelCustomEvents: number
}

export interface FullMetrics extends CoreMetrics, ConversionMetrics, MessageMetrics, VideoMetrics, EngagementMetrics, PixelMetrics {}

export interface MonthlyData {
  month: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  roas: number
  conversationsStarted: number
  leads: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findAction(actions: Array<{ action_type: string; value: string }>, type: string): number {
  return parseFloat(actions?.find(a => a.action_type === type)?.value ?? '0')
}

function findCostPerAction(data: Array<{ action_type: string; value: string }>, type: string): number {
  return parseFloat(data?.find(a => a.action_type === type)?.value ?? '0')
}

// ─── API Real ────────────────────────────────────────────────────────────────

const FIELDS = [
  'spend', 'impressions', 'reach', 'frequency',
  'clicks', 'unique_clicks', 'ctr', 'unique_ctr',
  'cpc', 'cpm', 'cpp',
  'actions', 'unique_actions', 'cost_per_action_type',
  'purchase_roas', 'website_purchase_roas',
  'video_play_actions', 'video_p25_watched_actions',
  'video_p50_watched_actions', 'video_p75_watched_actions',
  'video_p100_watched_actions', 'video_avg_time_watched_actions',
  'cost_per_thruplay', 'video_thruplay_watched_actions',
].join(',')

export async function fetchMetaMetrics(
  adAccountId: string,
  accessToken: string,
  datePreset = 'last_30d'
): Promise<FullMetrics> {
  const cleanId = adAccountId.replace(/^act_/, '')
  const url = `https://graph.facebook.com/v21.0/act_${cleanId}/insights?fields=${FIELDS}&date_preset=${datePreset}&access_token=${accessToken}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Meta API error:', res.status, err)
    throw new Error(`Meta API error: ${res.status} - ${err?.error?.message ?? 'Unknown'}`)
  }

  const json = await res.json()
  const d = json.data?.[0] ?? {}
  const actions: Array<{ action_type: string; value: string }> = d.actions ?? []
  const costPer: Array<{ action_type: string; value: string }> = d.cost_per_action_type ?? []
  const videoPlay: Array<{ action_type: string; value: string }> = d.video_play_actions ?? []

  const purchases = findAction(actions, 'offsite_conversion.fb_pixel_purchase') || findAction(actions, 'purchase') || findAction(actions, 'omni_purchase')
  const leads     = findAction(actions, 'offsite_conversion.fb_pixel_lead') || findAction(actions, 'lead')
  const conversions = findAction(actions, 'offsite_conversion.fb_pixel_custom') || purchases + leads || parseInt(d.conversions ?? '0')

  return {
    // Core
    spend:       parseFloat(d.spend ?? '0'),
    impressions: parseInt(d.impressions ?? '0'),
    clicks:      parseInt(d.clicks ?? '0'),
    uniqueClicks:parseInt(d.unique_clicks ?? '0'),
    cpc:         parseFloat(d.cpc ?? '0'),
    cpm:         parseFloat(d.cpm ?? '0'),
    cpp:         parseFloat(d.cpp ?? '0'),
    ctr:         parseFloat(d.ctr ?? '0'),
    uniqueCtr:   parseFloat(d.unique_ctr ?? '0'),
    reach:       parseInt(d.reach ?? '0'),
    frequency:   parseFloat(d.frequency ?? '0'),

    // Conversões
    conversions,
    costPerConversion: findCostPerAction(costPer, 'offsite_conversion.fb_pixel_custom') || (conversions > 0 ? parseFloat(d.spend ?? '0') / conversions : 0),
    roas:              parseFloat(d.purchase_roas?.[0]?.value ?? d.website_purchase_roas?.[0]?.value ?? '0'),
    purchases,
    purchaseValue:     purchases * (parseFloat(d.purchase_roas?.[0]?.value ?? '0') * parseFloat(d.spend ?? '0') / Math.max(purchases, 1)),
    leads,
    costPerLead:       findCostPerAction(costPer, 'offsite_conversion.fb_pixel_lead') || findCostPerAction(costPer, 'lead'),
    addToCart:         findAction(actions, 'offsite_conversion.fb_pixel_add_to_cart'),
    initiateCheckout:  findAction(actions, 'offsite_conversion.fb_pixel_initiate_checkout'),
    viewContent:       findAction(actions, 'offsite_conversion.fb_pixel_view_content'),
    completeRegistration: findAction(actions, 'offsite_conversion.fb_pixel_complete_registration'),

    // Mensagens
    conversationsStarted:    findAction(actions, 'onsite_conversion.messaging_conversation_started_7d') || findAction(actions, 'messaging_conversation_started_7d'),
    costPerConversation:     findCostPerAction(costPer, 'onsite_conversion.messaging_conversation_started_7d'),
    messagingReplies:        findAction(actions, 'onsite_conversion.messaging_first_reply'),
    newMessagingConnections: findAction(actions, 'onsite_conversion.messaging_welcome_message_view'),

    // Vídeo
    videoPlays:      findAction(videoPlay, 'video_view') || parseInt(d.video_play_actions?.[0]?.value ?? '0'),
    video25Pct:      parseInt(d.video_p25_watched_actions?.[0]?.value ?? '0'),
    video50Pct:      parseInt(d.video_p50_watched_actions?.[0]?.value ?? '0'),
    video75Pct:      parseInt(d.video_p75_watched_actions?.[0]?.value ?? '0'),
    video100Pct:     parseInt(d.video_p100_watched_actions?.[0]?.value ?? '0'),
    avgWatchTime:    parseFloat(d.video_avg_time_watched_actions?.[0]?.value ?? '0'),
    costPerThruplay: parseFloat(d.cost_per_thruplay?.[0]?.value ?? '0'),
    thruplayWatched: parseInt(d.video_thruplay_watched_actions?.[0]?.value ?? '0'),

    // Engajamento
    postEngagements: findAction(actions, 'post_engagement'),
    pageEngagements: findAction(actions, 'page_engagement'),
    reactions:       findAction(actions, 'post_reaction'),
    comments:        findAction(actions, 'comment'),
    shares:          findAction(actions, 'post'),
    pageLikes:       findAction(actions, 'like'),
    postSaves:       findAction(actions, 'onsite_conversion.post_save'),
    linkClicks:      findAction(actions, 'link_click'),

    // Pixel
    pixelFires:                 findAction(actions, 'offsite_conversion'),
    pixelPurchases:             purchases,
    pixelLeads:                 leads,
    pixelAddToCart:             findAction(actions, 'offsite_conversion.fb_pixel_add_to_cart'),
    pixelInitiateCheckout:      findAction(actions, 'offsite_conversion.fb_pixel_initiate_checkout'),
    pixelCompleteRegistration:  findAction(actions, 'offsite_conversion.fb_pixel_complete_registration'),
    pixelViewContent:           findAction(actions, 'offsite_conversion.fb_pixel_view_content'),
    pixelSearches:              findAction(actions, 'offsite_conversion.fb_pixel_search'),
    pixelCustomEvents:          findAction(actions, 'offsite_conversion.fb_pixel_custom'),
  }
}

export async function fetchMonthlyData(adAccountId: string, accessToken: string): Promise<MonthlyData[]> {
  const cleanId = adAccountId.replace(/^act_/, '')
  const months = getLast6Months()
  const results: MonthlyData[] = []
  for (const { label, since, until } of months) {
    const fields = 'spend,impressions,clicks,actions,purchase_roas'
    const url = `https://graph.facebook.com/v21.0/act_${cleanId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&access_token=${accessToken}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      const d = data.data?.[0] ?? {}
      const actions: Array<{ action_type: string; value: string }> = d.actions ?? []
      const conversions = findAction(actions, 'offsite_conversion.fb_pixel_purchase') + findAction(actions, 'lead')
      results.push({
        month: label,
        spend: parseFloat(d.spend ?? '0'),
        clicks: parseInt(d.clicks ?? '0'),
        impressions: parseInt(d.impressions ?? '0'),
        conversions,
        roas: parseFloat(d.purchase_roas?.[0]?.value ?? '0'),
        conversationsStarted: findAction(actions, 'onsite_conversion.messaging_conversation_started_7d'),
        leads: findAction(actions, 'lead') || findAction(actions, 'offsite_conversion.fb_pixel_lead'),
      })
    } catch {
      results.push({ month: label, spend: 0, clicks: 0, impressions: 0, conversions: 0, roas: 0, conversationsStarted: 0, leads: 0 })
    }
  }
  return results
}

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const since = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const until = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
    const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
    months.push({ label, since, until })
  }
  return months
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export function getMockMetrics(): FullMetrics {
  return {
    spend: 4850.75, impressions: 312400, clicks: 8920, uniqueClicks: 7340,
    cpc: 0.54, cpm: 15.52, cpp: 3.34, ctr: 2.86, uniqueCtr: 2.35,
    reach: 145000, frequency: 2.15,
    conversions: 234, costPerConversion: 20.73, roas: 4.2,
    purchases: 87, purchaseValue: 18750, leads: 147, costPerLead: 12.40,
    addToCart: 312, initiateCheckout: 198, viewContent: 2840, completeRegistration: 64,
    conversationsStarted: 418, costPerConversation: 11.60, messagingReplies: 389, newMessagingConnections: 291,
    videoPlays: 48200, video25Pct: 32100, video50Pct: 21400, video75Pct: 13800, video100Pct: 7200,
    avgWatchTime: 14.3, costPerThruplay: 0.67, thruplayWatched: 7200,
    postEngagements: 6720, pageEngagements: 4310, reactions: 1840, comments: 420,
    shares: 230, pageLikes: 185, postSaves: 640, linkClicks: 8920,
    pixelFires: 3120, pixelPurchases: 87, pixelLeads: 147, pixelAddToCart: 312,
    pixelInitiateCheckout: 198, pixelCompleteRegistration: 64, pixelViewContent: 2840,
    pixelSearches: 520, pixelCustomEvents: 180,
  }
}

export function getMockMonthlyData(): MonthlyData[] {
  return [
    { month: 'nov', spend: 2100, clicks: 5200, impressions: 180000, conversions: 98,  roas: 3.1, conversationsStarted: 210, leads: 72 },
    { month: 'dez', spend: 3800, clicks: 9100, impressions: 290000, conversions: 187, roas: 4.8, conversationsStarted: 390, leads: 140 },
    { month: 'jan', spend: 2950, clicks: 6800, impressions: 210000, conversions: 134, roas: 3.7, conversationsStarted: 285, leads: 98 },
    { month: 'fev', spend: 3200, clicks: 7400, impressions: 240000, conversions: 156, roas: 4.1, conversationsStarted: 320, leads: 115 },
    { month: 'mar', spend: 4100, clicks: 8600, impressions: 285000, conversions: 201, roas: 4.5, conversationsStarted: 380, leads: 138 },
    { month: 'abr', spend: 4850, clicks: 8920, impressions: 312400, conversions: 234, roas: 4.2, conversationsStarted: 418, leads: 147 },
  ]
}
