import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook recebido da Evolution API quando chega mensagem no WhatsApp
export async function POST(req: NextRequest) {
  try {
    // Validação básica do webhook (verifica apikey se configurada)
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
    const apiKey = req.headers.get('apikey')
    if (EVOLUTION_KEY && apiKey && apiKey !== EVOLUTION_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event, data, instance } = body

    if (event !== 'messages.upsert') return NextResponse.json({ ok: true })

    // Suporta Evolution API v1 (data.messages[0]) e v2 (data é a mensagem diretamente)
    const msg = data?.messages?.[0] ?? (data?.key ? data : null)
    if (!msg || msg.key?.fromMe) return NextResponse.json({ ok: true })

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
    const instName = typeof instance === 'string' ? instance : (body.sender ?? body.instanceName ?? '')
    const whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { instanceName: instName },
    })
    if (!whatsappInstance) return NextResponse.json({ ok: true })

    // Busca lead existente pelo telefone
    let lead = await prisma.lead.findFirst({
      where: { phone, userId: whatsappInstance.userId },
    })

    // Se não existe, cria novo lead
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          phone,
          name: msg.pushName ?? msg.verifiedBizName ?? phone,
          status: 'new',
          adSource: 'WhatsApp',
          userId: whatsappInstance.userId,
          whatsappInstanceId: whatsappInstance.id,
        },
      })
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

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'BlueMetrics Webhook OK' })
}
