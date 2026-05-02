import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { credential, password } = await req.json()
    if (!credential || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    const isCPF = /^\d{11}$/.test(credential.replace(/\D/g, ''))
    const user = isCPF
      ? await prisma.user.findUnique({ where: { cpf: credential.replace(/\D/g, '') } })
      : await prisma.user.findUnique({ where: { email: credential } })

    if (!user) {
      return NextResponse.json({ error: 'E-mail/CPF ou senha incorretos' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'E-mail/CPF ou senha incorretos' }, { status: 401 })
    }

    if (user.suspended) {
      return NextResponse.json({ error: 'Sua conta foi suspensa. Entre em contato com o administrador.' }, { status: 403 })
    }

    const token = await signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ ok: true, onboardingCompleted: user.onboardingCompleted })
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
