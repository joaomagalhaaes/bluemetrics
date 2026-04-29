'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, BarChart2, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function LoginPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCPF = credential.replace(/\D/g, '').length >= 3 && !/[@.]/.test(credential.replace(/\d/g, ''))

  function handleCredentialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (/^\d/.test(val) || val === '') {
      setCredential(formatCPF(val))
    } else {
      setCredential(val)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credential.replace(/\D/g, '').length === 11 ? credential.replace(/\D/g, '') : credential, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'E-mail/CPF ou senha incorretos')
      router.push(data.onboardingCompleted ? '/dashboard' : '/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-blue-500 dark:text-blue-400 hover:scale-110 transition-transform"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-400 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-400/30 mb-4">
            <BarChart2 size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BlueMetrics</h1>
          <p className="text-sm text-blue-400 mt-1">Seus resultados em tempo real</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-blue-100 dark:shadow-none border border-blue-100 dark:border-gray-800 p-7">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Entrar na sua conta</h2>
          <p className="text-sm text-gray-400 mb-6">Use seu e-mail ou CPF</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                E-mail ou CPF
              </label>
              <input
                type="text"
                inputMode={isCPF ? 'numeric' : 'email'}
                value={credential}
                onChange={handleCredentialChange}
                required
                placeholder="seu@email.com ou 000.000.000-00"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-400 hover:bg-blue-500 active:bg-blue-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-400/30 text-sm mt-1"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-500 font-semibold">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
