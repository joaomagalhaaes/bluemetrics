import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, cpf, phone, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const cpfClean = typeof cpf === 'string' && cpf.replace(/\D/g, '').length === 11
      ? cpf.replace(/\D/g, '') : null

    if (cpfClean) {
      const cpfExists = await prisma.user.findUnique({ where: { cpf: cpfClean } })
      if (cpfExists) return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const user = await prisma.user.create({
      data: {
        name, email, password: hashed, cpf: cpfClean,
        phone: typeof phone === 'string' && phone.replace(/\D/g, '').length >= 10 ? phone.replace(/\D/g, '') : null,
      },
    })

    await prisma.subscription.create({
      data: { userId: user.id, status: 'trial', trialEnd },
    })

    const token = await signToken({ userId: user.id, email: user.email })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
