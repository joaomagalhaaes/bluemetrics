import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * WhatsApp Cloud API Webhook
 *
 * GET  — Verificação do webhook (Meta envia challenge)
 * POST — Recebe mensagens em tempo real
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bluemetrics_verify_token'

// GET — Meta verifica o webhook com um challenge
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Cloud API] Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — Recebe notificações de mensagens
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verifica se é notificação do WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true })
    }

    // Processa cada entry (pode vir mais de uma)
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue

        const value = change.value
        if (!value?.messages?.length) continue

        const metadata = value.metadata
        const phoneNumberId = metadata?.phone_number_id

        // Busca instância pelo phoneNumberId
        const instance = await prisma.whatsappInstance.findFirst({
          where: { phoneNumberId, provider: 'cloud_api' },
        })

        if (!instance) {
          console.warn(`[Cloud API] Instância não encontrada para phoneNumberId: ${phoneNumberId}`)
          continue
        }

        // Processa cada mensagem
        for (const msg of value.messages) {
          // Ignora status updates (delivered, read, etc)
          if (!msg.type || msg.type === 'system') continue

          const phone = msg.from // número do remetente (ex: 5511999999999)
          const timestamp = new Date(parseInt(msg.timestamp) * 1000)

          // Extrai o texto da mensagem baseado no tipo
          let message = '[mídia]'
          switch (msg.type) {
            case 'text':
              message = msg.text?.body ?? '[texto vazio]'
              break
            case 'image':
              message = msg.image?.caption || '[imagem]'
              break
            case 'video':
              message = msg.video?.caption || '[vídeo]'
              break
            case 'audio':
              message = '[áudio]'
              break
            case 'document':
              message = msg.document?.filename || '[documento]'
              break
            case 'sticker':
              message = '[sticker]'
              break
            case 'location':
              message = `[localização: ${msg.location?.latitude}, ${msg.location?.longitude}]`
              break
            case 'contacts':
              message = '[contato compartilhado]'
              break
            case 'button':
              message = msg.button?.text || '[botão]'
              break
            case 'interactive':
              message = msg.interactive?.button_reply?.title
                || msg.interactive?.list_reply?.title
                || '[interativo]'
              break
            case 'reaction':
              message = `[reação: ${msg.reaction?.emoji || ''}]`
              break
            case 'order':
              message = '[pedido recebido]'
              break
          }

          // Busca nome do contato
          const contactName = value.contacts?.find(
            (c: { wa_id: string; profile?: { name?: string } }) => c.wa_id === phone
          )?.profile?.name || phone

          // Busca ou cria lead
          let lead = await prisma.lead.findFirst({
            where: { phone, userId: instance.userId },
          })

          if (!lead) {
            lead = await prisma.lead.create({
              data: {
                phone,
                name: contactName,
                status: 'new',
                adSource: 'WhatsApp Cloud',
                userId: instance.userId,
                whatsappInstanceId: instance.id,
              },
            })
          }

          // Salva a mensagem
          await prisma.conversation.create({
            data: {
              leadId: lead.id,
              message,
              fromMe: false,
              timestamp,
            },
          })

          // Atualiza o lead
          await prisma.lead.update({
            where: { id: lead.id },
            data: { updatedAt: new Date() },
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Cloud API] Webhook error:', err)
    // Sempre retorna 200 para Meta não reenviar
    return NextResponse.json({ ok: true })
  }
}
