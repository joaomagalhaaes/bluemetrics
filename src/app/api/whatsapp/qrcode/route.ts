import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instanceName = req.nextUrl.searchParams.get('instance')
  if (!instanceName) return NextResponse.json({ error: 'instance obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
  }

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })
    const data = await res.json()
    // Evolution API retorna { code, base64 } ou { instance: { state } }
    return NextResponse.json(data)
  } catch (e) {
    console.error('QR code error:', e)
    return NextResponse.json({ error: 'Erro ao buscar QR code' }, { status: 500 })
  }
}
