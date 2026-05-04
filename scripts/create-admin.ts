import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'joaovitormagalhaes001@gmail.com'
  const password = process.argv[2]

  if (!password) {
    console.error('Uso: npx tsx scripts/create-admin.ts <senha>')
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: 'João Vitor',
      email,
      password: hashed,
      role: 'admin',
      onboardingCompleted: true,
      adminApproved: true,
    },
    update: {
      role: 'admin',
      password: hashed,
    },
  })

  // Criar subscription admin
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, status: 'active', plan: 'annual' },
    update: { status: 'active' },
  })

  console.log(`✅ Admin criado: ${user.email} (id: ${user.id})`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
