import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  // Em produção, NUNCA aceitar sem secret — impede tokens forjados
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET não está definido em produção!')
  }
  console.warn('⚠️ JWT_SECRET não definido — usando fallback APENAS em dev')
}
const SECRET = new TextEncoder().encode(
  jwtSecret || 'dev-only-fallback-never-use-in-prod-' + Math.random()
)

export async function signToken(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Reduzido de 7 dias para 24 horas
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return await verifyToken(token)
}
