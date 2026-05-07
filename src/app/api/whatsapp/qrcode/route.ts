import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getEvolutionConfig, evolutionHeaders, createInstance } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instanceName = req.nextUrl.searchParams.get('instance')
  if (!instanceName) return NextResponse.json({ error: 'instance obrigatório' }, { status: 400 })

  const { url: EVOLUTION_URL, configured } = getEvolutionConfig()
  if (!configured) {
    return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
  }

  const headers = evolutionHeaders()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bluemetrics-phi.vercel.app'}/api/whatsapp/webhook`

  try {
    // 1ª tentativa: busca QR direto
    let res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })

    // Se não encontrou (404), cria a instância com webhook e tenta de novo
    if (res.status === 404 || !res.ok) {
      console.log(`[qrcode] Instance "${instanceName}" not found, creating with webhook...`)
      await createInstance(instanceName, webhookUrl)
      // Aguarda um momento para a instância inicializar
      await new Promise(r => setTimeout(r, 1500))
      res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { headers })
    }

    const data = await res.json()

    if (!res.ok) {
      console.error('[qrcode] Evolution API error:', data)
      return NextResponse.json({ error: data.message ?? 'Erro na Evolution API' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[qrcode] Error:', e)
    return NextResponse.json({ error: 'Não foi possível conectar à Evolution API' }, { status: 500 })
  }
}
