import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: JWT_SECRET is not set in production!')
}
const SECRET = new TextEncoder().encode(
  jwtSecret ?? 'ads-dashboard-dev-only-secret-2024'
)

export async function signToken(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
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
