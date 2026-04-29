'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart2, TrendingUp, Eye, MousePointer,
  DollarSign, CheckCircle, ArrowRight, Smartphone
} from 'lucide-react'

type Step = 'welcome' | 'tutorial' | 'connect' | 'done'

const TUTORIAL_ITEMS = [
  {
    icon: DollarSign,
    color: 'bg-blue-400',
    title: 'Quanto você investiu',
    desc: 'Veja exatamente quanto foi gasto nos seus anúncios em cada período.',
  },
  {
    icon: Eye,
    color: 'bg-purple-400',
    title: 'Pessoas que viram seu anúncio',
    desc: 'Quantas vezes seu anúncio apareceu para as pessoas na tela delas.',
  },
  {
    icon: MousePointer,
    color: 'bg-green-400',
    title: 'Pessoas que clicaram',
    desc: 'Quem ficou interessado e clicou para saber mais sobre o seu produto.',
  },
  {
    icon: TrendingUp,
    color: 'bg-orange-400',
    title: 'Retorno do investimento',
    desc: 'Para cada R$1 gasto em anúncios, quanto voltou em vendas para você.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [userName, setUserName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUserName(d.name?.split(' ')[0] ?? ''))
  }, [])

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) { setError('O ID da conta é obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName || 'Minha Empresa',
          adAccountId: accountId.replace('act_', ''),
          accessToken: accessToken || null,
        }),
      })
      await fetch('/api/auth/complete-onboarding', { method: 'POST' })
      setStep('done')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Boas-vindas */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-400/30">
              <BarChart2 size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Olá{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8">
              Bem-vindo ao seu painel de anúncios.<br />
              Aqui você vai acompanhar os resultados dos seus anúncios de forma simples e clara.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-8 text-left">
              <div className="flex items-start gap-3">
                <Smartphone size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Use como app no celular</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Toque em <strong>"Adicionar à tela inicial"</strong> no seu navegador para instalar o app.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('tutorial')}
              className="w-full py-3.5 bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 text-base"
            >
              Começar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Tutorial */}
        {step === 'tutorial' && (
          <div>
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Como funciona</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">O que você vai ver no painel</h2>
            </div>

            <div className="space-y-3 mb-8">
              {TUTORIAL_ITEMS.map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('connect')}
              className="w-full py-3.5 bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 text-base"
            >
              Conectar minha conta <ArrowRight size={18} />
            </button>
            <button onClick={() => setStep('welcome')} className="w-full text-center text-sm text-gray-400 mt-3 py-1">
              ← Voltar
            </button>
          </div>
        )}

        {/* Conectar conta */}
        {step === 'connect' && (
          <div>
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Quase lá!</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conecte sua conta de anúncios</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Para ver suas métricas, precisamos do ID da sua conta no Gerenciador de Anúncios da Meta.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-5">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">📍 Como encontrar o ID?</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                Acesse <strong>business.facebook.com</strong> → clique em sua conta de anúncios → o número no topo da página é o seu ID.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nome da empresa
                </label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ex: Minha Loja"
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ID da conta de anúncios <span className="text-red-400">*</span>
                </label>
                <input
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  required
                  placeholder="Ex: 123456789012"
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Token de acesso <span className="text-gray-400 font-normal">(opcional — adicione depois)</span>
                </label>
                <input
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="Deixe em branco por enquanto"
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 text-base mt-1"
              >
                {loading ? 'Salvando...' : (<>Ir para o painel <ArrowRight size={18} /></>)}
              </button>
            </form>
            <button onClick={() => setStep('tutorial')} className="w-full text-center text-sm text-gray-400 mt-3 py-1">
              ← Voltar
            </button>
          </div>
        )}

        {/* Concluído */}
        {step === 'done' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-400/30">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Tudo pronto! 🎉</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8">
              Sua conta está configurada. Agora você pode acompanhar os resultados dos seus anúncios a qualquer momento.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-400/30 flex items-center justify-center gap-2 text-base"
            >
              Ver meu painel <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {(['welcome', 'tutorial', 'connect', 'done'] as Step[]).map(s => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                s === step ? 'w-6 h-2 bg-blue-400' : 'w-2 h-2 bg-blue-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
