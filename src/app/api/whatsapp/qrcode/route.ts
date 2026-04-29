import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

const headers = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_KEY,
}

async function ensureInstance(instanceName: string) {
  // Tenta criar a instância no Evolution API (ignora erro se já existir)
  await fetch(`${EVOLUTION_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName,
      token: '',
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instanceName = req.nextUrl.searchParams.get('instance')
  if (!instanceName) return NextResponse.json({ error: 'instance obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
  }

  try {
    // 1ª tentativa: busca QR direto
    let res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })

    // Se não encontrou (404), cria a instância e tenta de novo
    if (res.status === 404 || !res.ok) {
      await ensureInstance(instanceName)
      // Aguarda um momento para a instância inicializar
      await new Promise(r => setTimeout(r, 1500))
      res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })
    }

    const data = await res.json()

    if (!res.ok) {
      console.error('Evolution API error:', data)
      return NextResponse.json({ error: data.message ?? 'Erro na Evolution API' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('QR code error:', e)
    return NextResponse.json({ error: 'Não foi possível conectar à Evolution API' }, { status: 500 })
  }
}
