import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Catch-all route for Evolution API v2 webhookByEvents
// Evolution sends to /webhook/messages-upsert, /webhook/connection-update, etc.
export async function POST(req: NextRequest, { params }: { params: { event: string[] } }) {
  try {
    const eventPath = params.event.join('/') // e.g. "messages-upsert"
    const body = await req.json()

    console.log(`[webhook/${eventPath}] BODY:`, JSON.stringify(body).slice(0, 1500))

    // Only process messages-upsert events
    if (eventPath !== 'messages-upsert') {
      return NextResponse.json({ ok: true })
    }

    // Evolution v2 webhookByEvents sends the data directly (not wrapped in {event, data})
    // The body IS the data array or object
    let msg = null
    if (Array.isArray(body)) {
      msg = body[0]
    } else if (body.data && Array.isArray(body.data)) {
      msg = body.data[0]
    } else if (body.data?.messages) {
      msg = body.data.messages[0]
    } else if (body.data?.key) {
      msg = body.data
    } else if (body.key) {
      msg = body
    } else if (body.messages) {
      msg = body.messages[0]
    }

    if (!msg) {
      console.log(`[webhook/${eventPath}] No message found`)
      return NextResponse.json({ ok: true })
    }

    if (msg.key?.fromMe) return NextResponse.json({ ok: true })

    const phone = msg.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '') ?? ''
    if (!phone || phone.includes('@')) return NextResponse.json({ ok: true })

    const message = msg.message?.conversation
      ?? msg.message?.extendedTextMessage?.text
      ?? msg.message?.imageMessage?.caption
      ?? msg.message?.videoMessage?.caption
      ?? '[mídia]'

    const tsRaw = msg.messageTimestamp
    const tsNum = tsRaw && typeof tsRaw === 'object' ? (tsRaw.low ?? Date.now() / 1000) : (tsRaw ?? Date.now() / 1000)
    const timestamp = new Date(tsNum * 1000)

    // Try to find instance name from various fields
    const instName = body.instance ?? body.sender ?? body.instanceName ?? body.data?.instance ?? ''

    console.log(`[webhook/${eventPath}] Instance: "${instName}", phone: ${phone}, msg: ${message.slice(0, 50)}`)

    // Find instance in DB
    let whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { instanceName: instName },
    })

    if (!whatsappInstance) {
      // Try partial match
      const allInstances = await prisma.whatsappInstance.findMany()
      whatsappInstance = allInstances.find(i =>
        i.instanceName.toLowerCase() === instName.toLowerCase() ||
        instName.toLowerCase().includes(i.instanceName.toLowerCase()) ||
        i.instanceName.toLowerCase().includes(instName.toLowerCase())
      ) ?? null
    }

    if (!whatsappInstance) {
      // Last resort: use the first instance
      whatsappInstance = await prisma.whatsappInstance.findFirst()
      if (!whatsappInstance) {
        console.log(`[webhook/${eventPath}] No instance found at all`)
        return NextResponse.json({ ok: true })
      }
      console.log(`[webhook/${eventPath}] Using fallback instance: ${whatsappInstance.instanceName}`)
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: { phone, userId: whatsappInstance.userId },
    })

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
      console.log(`[webhook/${eventPath}] New lead: ${lead.id} (${phone})`)
    }

    await prisma.conversation.create({
      data: { leadId: lead.id, message, fromMe: false, timestamp },
    })

    await prisma.lead.update({
      where: { id: lead.id },
      data: { updatedAt: new Date() },
    })

    console.log(`[webhook/${eventPath}] Message saved for lead ${lead.id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/catch-all] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'BlueMetrics Webhook Catch-All OK' })
}
