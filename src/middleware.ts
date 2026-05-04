import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/register', '/billing']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rotas públicas — libera sem verificação
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (pathname.startsWith('/api/auth')) return NextResponse.next()
  if (pathname.startsWith('/api/billing/webhook')) return NextResponse.next()
  if (pathname.startsWith('/api/whatsapp/webhook')) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/icon') || pathname === '/manifest.json') {
    return NextResponse.next()
  }

  // Verifica token JWT
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.redirect(new URL('/', req.url))

  const session = await verifyToken(token)
  if (!session) {
    // Token inválido ou expirado — limpa cookie e redireciona
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.delete('token')
    return res
  }

  // Proteção de rotas admin — bloqueia se não for admin
  // (O JWT não contém role, então a verificação final fica na API,
  //  mas aqui já impedimos acesso não autenticado)

  const response = NextResponse.next()

  // Adiciona userId ao header para que APIs possam usar (opcional)
  response.headers.set('x-user-id', session.userId)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
