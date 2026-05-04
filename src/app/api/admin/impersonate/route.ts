import { NextRequest, NextResponse } from 'next/server'
import { getSession, signToken, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, email: true },
  })
  if (!user || user.role !== 'admin') return null
  return user
}

// POST — admin assume a sessão de outro usuário
export async function POST(req: NextRequest) {
  // Verifica se quem está logado é admin (ou se o admin está no cookie admin_token)
  const cookieStore = cookies()
  const adminTokenCookie = cookieStore.get('admin_token')?.value

  let adminUser: { id: string; role: string; email: string } | null = null

  if (adminTokenCookie) {
    // Já está impersonando — verifica o token original do admin
    const adminSession = await verifyToken(adminTokenCookie)
    if (adminSession) {
      const u = await prisma.user.findUnique({
        where: { id: adminSession.userId },
        select: { id: true, role: true, email: true },
      })
      if (u && u.role === 'admin') adminUser = u
    }
  } else {
    adminUser = await requireAdmin()
  }

  if (!adminUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  }

  // Não pode impersonar a si mesmo
  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'Você já está na sua própria conta' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // Gera token JWT para o usuário alvo
  const newToken = await signToken({ userId: targetUser.id, email: targetUser.email })

  // Salva o token original do admin (se ainda não tiver)
  const currentAdminToken = adminTokenCookie || cookieStore.get('token')?.value

  const response = NextResponse.json({
    ok: true,
    message: `Acessando conta de ${targetUser.name}`,
    userName: targetUser.name,
    userEmail: targetUser.email,
  })

  // Cookie do usuário alvo
  response.cookies.set('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 horas de impersonação
    path: '/',
  })

  // Cookie com token do admin original (para poder voltar)
  response.cookies.set('admin_token', currentAdminToken || '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
    path: '/',
  })

  // Cookie legível pelo frontend para mostrar o banner
  response.cookies.set('impersonating', JSON.stringify({
    userName: targetUser.name,
    userEmail: targetUser.email,
    userId: targetUser.id,
  }), {
    httpOnly: false, // precisa ser lido pelo JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
    path: '/',
  })

  return response
}

// DELETE — volta para a conta do admin
export async function DELETE() {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin_token')?.value

  if (!adminToken) {
    return NextResponse.json({ error: 'Nenhuma sessão admin para restaurar' }, { status: 400 })
  }

  // Verifica se o token do admin ainda é válido
  const adminSession = await verifyToken(adminToken)
  if (!adminSession) {
    const response = NextResponse.json({ error: 'Sessão admin expirada — faça login novamente' }, { status: 401 })
    response.cookies.delete('admin_token')
    response.cookies.delete('impersonating')
    return response
  }

  const response = NextResponse.json({ ok: true, message: 'Voltou para a conta admin' })

  // Restaura o token do admin
  response.cookies.set('token', adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  // Remove cookies de impersonação
  response.cookies.delete('admin_token')
  response.cookies.delete('impersonating')

  return response
}
