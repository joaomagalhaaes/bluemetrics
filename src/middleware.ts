import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/register', '/billing']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (pathname.startsWith('/api/auth')) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/icon') || pathname === '/manifest.json') {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.redirect(new URL('/', req.url))

  const session = await verifyToken(token)
  if (!session) return NextResponse.redirect(new URL('/', req.url))

  // Proteger rota admin no middleware (segunda camada de segurança)
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/dashboard/admin')) {
    // A verificação real de role é feita na API, aqui só garantimos que está logado
    // (não dá pra consultar banco no middleware Edge)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
