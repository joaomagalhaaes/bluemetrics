/**
 * Meta Graph API — Token Exchange
 *
 * Converte um token de curta duração (~1-2h) em um token de longa duração (~60 dias).
 * Requer appId + appSecret do Meta App do usuário.
 *
 * Docs: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */

interface ExchangeResult {
  longLivedToken: string
  expiresAt: Date
}

interface ExchangeError {
  error: string
}

type ExchangeResponse = ExchangeResult | ExchangeError

function isError(res: ExchangeResponse): res is ExchangeError {
  return 'error' in res
}

/**
 * Troca um token de curta duração por um de longa duração (~60 dias).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<ExchangeResponse> {
  try {
    const url = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
    url.searchParams.set('grant_type', 'fb_exchange_token')
    url.searchParams.set('client_id', appId)
    url.searchParams.set('client_secret', appSecret)
    url.searchParams.set('fb_exchange_token', shortLivedToken)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? 'Erro desconhecido ao trocar token'
      console.error('[meta-token] Exchange failed:', msg)
      return { error: msg }
    }

    const accessToken = data.access_token as string
    const expiresIn = (data.expires_in as number) ?? 5184000 // default 60 dias

    return {
      longLivedToken: accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    }
  } catch (err) {
    console.error('[meta-token] Exchange error:', err)
    return { error: 'Falha na comunicação com a Meta API' }
  }
}

/**
 * Verifica se um token está perto de expirar (dentro de 3 dias).
 */
export function isTokenExpiringSoon(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false // desconhecido, não alerta
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return expiresAt.getTime() - Date.now() < threeDays
}

/**
 * Verifica se um token já expirou.
 */
export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false // desconhecido
  return expiresAt.getTime() < Date.now()
}

export { isError }
