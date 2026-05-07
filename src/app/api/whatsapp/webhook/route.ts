import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Detecta a origem do lead baseado na primeira mensagem.
 * Mensagens padrão de anúncios Meta Ads geralmente contêm frases como
 * "tenho interesse", "quero mais informações", "vi o anúncio", etc.
 */
function detectAdSource(message: string): string {
  const msg = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const adPatterns = [
    'tenho interesse',
    'quero mais informac',
    'quero saber mais',
    'vi o anuncio',
    'vi seu anuncio',
    'vi no instagram',
    'vi no facebook',
    'vi a propaganda',
    'vi no face',
    'vi no insta',
    'vi a publicacao',
    'vi o post',
    'gostaria de saber mais',
    'gostaria de mais informac',
    'ola, tenho interesse',
    'ola tenho interesse',
    'olá, tenho interesse',
    'interesse e quero',
    'me interessei',
    'quero informac',
    'pode me passar mais informac',
    'mais detalhes',
    'como funciona',
    'qual o valor',
    'qual valor',
    'quanto custa',
    'preco',
    'tabela de preco',
    'gostaria de agendar',
    'quero agendar',
    'ola! gostaria',
    'ola, gostaria',
    'olá! gostaria',
    'olá, gostaria',
    'boa tarde, tenho',
    'bom dia, tenho',
    'boa noite, tenho',
    'boa tarde, gostaria',
    'bom dia, gostaria',
    'boa noite, gostaria',
  ]

  for (const pattern of adPatterns) {
    if (msg.includes(pattern)) {
      return 'Meta Ads'
    }
  }

  return 'WhatsApp Orgânico'
}

// Webhook recebido da Evolution API quando chega mensagem no WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log completo para debug
    console.log('[webhook] FULL BODY:', JSON.stringify(body).slice(0, 1500))

    // Evolution v2 usa "messages.upsert", v1 pode usar "MESSAGES_UPSERT"
    const event = (body.event ?? '').toLowerCase().replace(/_/g, '.')
    if (event !== 'messages.upsert') {
      console.log(`[webhook] Ignoring event: ${body.event}`)
      return NextResponse.json({ ok: true })
    }

    // Evolution API v2 pode enviar data como array ou objeto
    // v2: body.data = [{ key, message, ... }] ou body.data = { key, message }
    // v1: body.data = { messages: [{ key, message }] }
    let msg = null
    if (Array.isArray(body.data)) {
      msg = body.data[0]
    } else if (body.data?.messages && Array.isArray(body.data.messages)) {
      msg = body.data.messages[0]
    } else if (body.data?.key) {
      msg = body.data
    }

    if (!msg) {
      console.log('[webhook] No message found in data')
      return NextResponse.json({ ok: true })
    }

    const fromMe = !!msg.key?.fromMe
    const phone = msg.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '') ?? ''
    if (!phone || phone.includes('@')) return NextResponse.json({ ok: true })

    const message = msg.message?.conversation
      ?? msg.message?.extendedTextMessage?.text
      ?? msg.message?.imageMessage?.caption
      ?? msg.message?.videoMessage?.caption
      ?? '[mídia]'

    // messageTimestamp pode ser number ou objeto protobuf { low, high }
    const tsRaw = msg.messageTimestamp
    const tsNum = tsRaw && typeof tsRaw === 'object' ? (tsRaw.low ?? Date.now() / 1000) : (tsRaw ?? Date.now() / 1000)
    const timestamp = new Date(tsNum * 1000)

    // Busca a instância pelo nome (instance pode ser string ou estar em sender/instanceName)
    const instName = typeof body.instance === 'string'
      ? body.instance
      : (body.sender ?? body.instanceName ?? body.data?.instance ?? '')

    console.log(`[webhook] Instance: "${instName}", phone: ${phone}, fromMe: ${fromMe}, msg: ${message.slice(0, 50)}`)

    // Busca instância no banco
    let whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { instanceName: instName },
    })

    if (!whatsappInstance) {
      // Tenta buscar por nome parcial
      const allInstances = await prisma.whatsappInstance.findMany()
      whatsappInstance = allInstances.find(i =>
        i.instanceName.toLowerCase() === instName.toLowerCase() ||
        instName.toLowerCase().includes(i.instanceName.toLowerCase()) ||
        i.instanceName.toLowerCase().includes(instName.toLowerCase())
      ) ?? null

      if (!whatsappInstance) {
        // Último recurso: usa a primeira instância
        whatsappInstance = allInstances[0] ?? null
        if (whatsappInstance) {
          console.log(`[webhook] Fallback to first instance: "${whatsappInstance.instanceName}"`)
        }
      }
    }

    if (!whatsappInstance) {
      console.log(`[webhook] No instance found at all`)
      return NextResponse.json({ ok: true })
    }

    return await processMessage(whatsappInstance, phone, message, timestamp, msg, fromMe)
  } catch (err) {
    console.error('[webhook] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function processMessage(
  whatsappInstance: { id: string; userId: string; instanceName: string },
  phone: string,
  message: string,
  timestamp: Date,
  msg: Record<string, unknown>,
  fromMe: boolean
) {
  // Busca lead existente pelo telefone
  let lead = await prisma.lead.findFirst({
    where: { phone, userId: whatsappInstance.userId },
  })

  // Se não existe e é mensagem recebida, cria novo lead
  if (!lead && !fromMe) {
    const pushName = (msg as Record<string, string>).pushName
      ?? (msg as Record<string, string>).verifiedBizName
      ?? phone

    const adSource = detectAdSource(message)

    lead = await prisma.lead.create({
      data: {
        phone,
        name: pushName,
        status: 'new',
        adSource,
        userId: whatsappInstance.userId,
        whatsappInstanceId: whatsappInstance.id,
      },
    })
    console.log(`[webhook] New lead created: ${lead.id} (${phone}) | origin: ${adSource}`)
  }

  // Se é fromMe mas não tem lead, ignora (não cria lead pra mensagens enviadas sem contexto)
  if (!lead) return NextResponse.json({ ok: true })

  // Salva a mensagem (recebida ou enviada)
  await prisma.conversation.create({
    data: { leadId: lead.id, message, fromMe, timestamp },
  })

  // Atualiza o lead
  await prisma.lead.update({
    where: { id: lead.id },
    data: { updatedAt: new Date() },
  })

  console.log(`[webhook] ${fromMe ? 'Sent' : 'Received'} msg saved for lead ${lead.id}: ${message.slice(0, 50)}`)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: 'BlueMetrics Webhook OK', timestamp: new Date().toISOString() })
}
