/**
 * Rate limiter simples em memória (sem dependências externas).
 * Funciona por IP — bloqueia após X tentativas em Y segundos.
 *
 * Em produção com múltiplas instâncias, migrar para Redis/Upstash.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas a cada 60 segundos
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 60_000)

interface RateLimitConfig {
  /** Máximo de requisições por janela */
  maxAttempts: number
  /** Janela em segundos */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxAttempts: 5, windowSeconds: 60 },
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // Primeira requisição ou janela expirou
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterSeconds: 0 }
  }

  // Dentro da janela
  entry.count++
  if (entry.count > config.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter }
  }

  return { allowed: true, remaining: config.maxAttempts - entry.count, retryAfterSeconds: 0 }
}

/**
 * Extrai o IP do request (funciona com Vercel / proxies).
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return '127.0.0.1'
}
