import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    if (msg.key?.fromMe) {
      console.log('[webhook] Message is fromMe, skipping')
      return NextResponse.json({ ok: true })
    }

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

    console.log(`[webhook] Looking for instance: "${instName}", phone: ${phone}, message: ${message.slice(0, 50)}`)

    const whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { instanceName: instName },
    })

    if (!whatsappInstance) {
      console.log(`[webhook] Instance "${instName}" not found in DB. Trying partial match...`)
      // Tenta buscar por nome parcial
      const allInstances = await prisma.whatsappInstance.findMany()
      const match = allInstances.find(i =>
        i.instanceName.toLowerCase() === instName.toLowerCase() ||
        instName.toLowerCase().includes(i.instanceName.toLowerCase()) ||
        i.instanceName.toLowerCase().includes(instName.toLowerCase())
      )
      if (!match) {
        console.log(`[webhook] No instance match found. Available:`, allInstances.map(i => i.instanceName))
        return NextResponse.json({ ok: true })
      }
      console.log(`[webhook] Partial match found: "${match.instanceName}"`)

      // Usa a instância encontrada
      return await processMessage(match, phone, message, timestamp, msg)
    }

    return await processMessage(whatsappInstance, phone, message, timestamp, msg)
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
  msg: Record<string, unknown>
) {
  // Busca lead existente pelo telefone
  let lead = await prisma.lead.findFirst({
    where: { phone, userId: whatsappInstance.userId },
  })

  // Se não existe, cria novo lead
  if (!lead) {
    const pushName = (msg as Record<string, string>).pushName
      ?? (msg as Record<string, string>).verifiedBizName
      ?? phone

    lead = await prisma.lead.create({
      data: {
        phone,
        name: pushName,
        status: 'new',
        adSource: 'WhatsApp',
        userId: whatsappInstance.userId,
        whatsappInstanceId: whatsappInstance.id,
      },
    })
    console.log(`[webhook] New lead created: ${lead.id} (${phone})`)
  }

  // Salva a mensagem
  await prisma.conversation.create({
    data: { leadId: lead.id, message, fromMe: false, timestamp },
  })

  // Atualiza o lead
  await prisma.lead.update({
    where: { id: lead.id },
    data: { updatedAt: new Date(), status: lead.status === 'new' ? 'new' : lead.status },
  })

  console.log(`[webhook] Message saved for lead ${lead.id}: ${message.slice(0, 50)}`)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: 'BlueMetrics Webhook OK', timestamp: new Date().toISOString() })
}
