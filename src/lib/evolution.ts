/**
 * Evolution API v2 helper functions
 */

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export function getEvolutionConfig() {
  return { url: EVOLUTION_URL, key: EVOLUTION_KEY, configured: !!(EVOLUTION_URL && EVOLUTION_KEY) }
}

export function evolutionHeaders() {
  return { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY }
}

/**
 * Configura o webhook de uma instância na Evolution API
 * Tenta múltiplos endpoints para compatibilidade com v1 e v2
 */
export async function setInstanceWebhook(instanceName: string, webhookUrl: string): Promise<{ ok: boolean; error?: string }> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return { ok: false, error: 'Evolution API não configurada' }
  }

  const headers = evolutionHeaders()

  const webhookBody = {
    url: webhookUrl,
    webhookByEvents: false,
    webhookBase64: false,
    events: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONNECTION_UPDATE',
      'CONTACTS_UPSERT',
      'CHATS_UPSERT',
      'CHATS_UPDATE',
      'CHATS_SET',
      'PRESENCE_UPDATE',
      'GROUPS_UPSERT',
      'GROUP_UPDATE',
      'CALL',
      'QRCODE_UPDATED',
    ],
    enabled: true,
  }

  const endpoints = [
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'PUT' },
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'POST' },
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`, method: 'PUT' },
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`, method: 'POST' },
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers,
        body: JSON.stringify(webhookBody),
      })

      if (res.ok) {
        console.log(`[evolution] Webhook set OK for "${instanceName}" via ${ep.method} ${ep.url}`)
        return { ok: true }
      }
    } catch (e) {
      console.error(`[evolution] Webhook set failed for "${instanceName}":`, e)
    }
  }

  return { ok: false, error: 'Nenhum endpoint respondeu com sucesso' }
}

/**
 * Cria uma instância na Evolution API com webhook já configurado
 */
export async function createInstance(instanceName: string, webhookUrl: string): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return { ok: false, error: 'Evolution API não configurada' }
  }

  try {
    // Evolution v2 - cria instância com webhook embutido
    const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: evolutionHeaders(),
      body: JSON.stringify({
        instanceName,
        token: '',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE',
            'CONNECTION_UPDATE',
            'CONTACTS_UPSERT',
            'CHATS_UPSERT',
          ],
          enabled: true,
        },
      }),
    })

    const data = await res.json()
    console.log(`[evolution] Instance create "${instanceName}":`, res.status, JSON.stringify(data).slice(0, 200))

    if (res.ok || res.status === 409) {
      // 409 = já existe, tudo bem
      // Configura webhook separadamente como fallback
      await setInstanceWebhook(instanceName, webhookUrl)
      return { ok: true, data }
    }

    return { ok: false, data, error: data.message ?? 'Erro ao criar instância' }
  } catch (e) {
    console.error(`[evolution] Create instance error:`, e)
    return { ok: false, error: String(e) }
  }
}

/**
 * Verifica estado de conexão de uma instância
 */
export async function getConnectionState(instanceName: string): Promise<string> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return 'unknown'

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: evolutionHeaders(),
    })
    const data = await res.json()
    return data?.instance?.state ?? data?.state ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Lista todas as instâncias da Evolution API
 */
export async function listAllInstances(): Promise<Array<{ instanceName: string; state: string; profilePicUrl?: string; profileName?: string }>> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return []

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: evolutionHeaders(),
    })
    if (!res.ok) return []
    const data = await res.json()
    // v2 retorna array de instâncias
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((inst: any) => ({
        instanceName: String(inst.instanceName ?? inst.instance?.instanceName ?? ''),
        state: String(inst.state ?? inst.instance?.state ?? 'unknown'),
        profilePicUrl: String(inst.profilePicUrl ?? ''),
        profileName: String(inst.profileName ?? ''),
      }))
    }
    return []
  } catch {
    return []
  }
}
