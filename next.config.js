/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Headers de segurança aplicados em todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede que o site seja aberto dentro de iframe (anti-clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o navegador "adivinhe" o tipo do arquivo
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Força HTTPS por 1 ano (HSTS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Impede vazamento de referrer para sites externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Bloqueia acesso a câmera, microfone, geolocalização etc
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Proteção XSS extra (navegadores antigos)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Impede que o DNS do navegador faça prefetch para domínios externos
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
