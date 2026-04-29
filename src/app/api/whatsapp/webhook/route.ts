import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook recebido da Evolution API quando chega mensagem no WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, data, instance } = body

    if (event !== 'messages.upsert') return NextResponse.json({ ok: true })

    const msg = data?.messages?.[0]
    if (!msg || msg.key?.fromMe) return NextResponse.json({ ok: true })

    const phone   = msg.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '') ?? ''
    const message = msg.message?.conversation
      ?? msg.message?.extendedTextMessage?.text
      ?? '[mídia]'
    const timestamp = new Date((msg.messageTimestamp ?? Date.now() / 1000) * 1000)

    // Busca a instância pelo nome
    const whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { instanceName: instance },
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
          name: msg.pushName ?? phone,
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
