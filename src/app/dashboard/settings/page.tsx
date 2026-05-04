'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, Sun, Moon, ChevronDown, ChevronUp, ExternalLink,
  Lock, Eye, EyeOff, CheckCircle, Bell, Shield, Trash2, LogOut, Key
} from 'lucide-react'
import { useTheme } from 'next-themes'

// ─── Guias (accordion) ───────────────────────────────────────────────────────

type Step = { num: string; title: string; desc: string; action?: string; link?: string; tip?: string }

const TOKEN_STEPS: Step[] = [
  { num: '1', title: 'Acesse o Meta for Developers', desc: 'Abra o navegador e acesse o site de desenvolvedores da Meta.', action: 'Acessar site', link: 'https://developers.facebook.com', tip: 'Faça login com o mesmo Facebook que gerencia sua conta de anúncios.' },
  { num: '2', title: 'Crie um aplicativo (App)', desc: 'No menu superior, clique em "Meus Apps" → "Criar App". Escolha o tipo "Empresa" e dê qualquer nome, como "Meu Dashboard".', tip: 'Não precisa publicar o app. É apenas para gerar o token.' },
  { num: '3', title: 'Vá para o Graph API Explorer', desc: 'No painel do seu app, clique em "Ferramentas" no menu superior → "Graph API Explorer".', action: 'Abrir Graph Explorer', link: 'https://developers.facebook.com/tools/explorer', tip: 'O Explorer é onde você gera o token de acesso.' },
  { num: '4', title: 'Selecione seu app e gere o token', desc: 'No Graph API Explorer: (1) No campo "Meta App", selecione o app que você criou. (2) Clique em "Gerar Token de Acesso". (3) Autorize quando solicitado.', tip: 'Uma janela pop-up vai aparecer pedindo permissão. Clique em "Continuar".' },
  { num: '5', title: 'Adicione as permissões necessárias', desc: 'Clique em "Adicionar permissão" e marque: ads_read e ads_management.', tip: 'Sem essas permissões, o token não consegue acessar os dados dos anúncios.' },
  { num: '6', title: 'Copie o token gerado', desc: 'O token aparece no campo "Token de Acesso". Copie ele inteiro e cole na aba "Conta de Anúncios" do BlueMetrics.', tip: 'Preencha também App ID e App Secret para que o token dure 60 dias.' },
]

const ID_STEPS: Step[] = [
  { num: '1', title: 'Acesse o Gerenciador de Negócios', desc: 'Abra business.facebook.com e faça login.', action: 'Abrir', link: 'https://business.facebook.com' },
  { num: '2', title: 'Vá em Configurações', desc: 'No menu lateral esquerdo, clique em "Configurações" (ícone de engrenagem).' },
  { num: '3', title: 'Encontre sua Conta de Anúncios', desc: 'Clique em "Contas de Anúncios" → selecione sua conta. O ID de 15 dígitos aparece abaixo do nome da conta (ex: 123456789012345).', tip: 'O ID também aparece na URL quando você está dentro do Gerenciador de Anúncios.' },
]

function Guide({ title, steps, open, onToggle }: { title: string; steps: Step[]; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
        {open ? <ChevronUp size={18} className="text-blue-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-blue-50 dark:border-gray-800">
          <div className="space-y-4 mt-4">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm shadow-blue-400/30 mt-0.5">{step.num}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  {step.tip && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-blue-600 dark:text-blue-400">💡 {step.tip}</p>
                    </div>
                  )}
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-500 font-medium">
                      <ExternalLink size={12} /> {step.action ?? 'Abrir'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [openGuide, setOpenGuide] = useState<string | null>(null)

  // Alterar senha
  const [showPassForm, setShowPassForm] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Info do usuário
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
  }, [])

  const toggle = (key: string) => setOpenGuide(v => v === key ? null : key)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassMsg(null)
    if (newPass.length < 6) { setPassMsg({ type: 'err', text: 'A nova senha deve ter ao menos 6 caracteres' }); return }
    if (newPass !== confirmPass) { setPassMsg({ type: 'err', text: 'As senhas não coincidem' }); return }

    setPassLoading(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      })
      const data = await res.json()
      if (!res.ok) { setPassMsg({ type: 'err', text: data.error ?? 'Erro ao alterar senha' }); return }
      setPassMsg({ type: 'ok', text: 'Senha alterada com sucesso!' })
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
      setTimeout(() => setShowPassForm(false), 2000)
    } finally { setPassLoading(false) }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={22} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Personalize o BlueMetrics</p>
        </div>
      </div>

      {/* ═══ APARÊNCIA ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Aparência</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Modo {theme === 'dark' ? 'Noite (escuro)' : 'Dia (claro)'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Alterne entre o tema claro e escuro</p>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-14 h-7 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'}`}>
              {theme === 'dark' ? <Moon size={12} className="text-blue-400" /> : <Sun size={12} className="text-amber-400" />}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ SEGURANÇA ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
          <Shield size={15} className="text-blue-400" /> Segurança
        </h2>

        {/* Alterar senha */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Alterar senha</p>
              <p className="text-xs text-gray-400 mt-0.5">Recomendamos trocar a senha periodicamente</p>
            </div>
            <button onClick={() => { setShowPassForm(v => !v); setPassMsg(null) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              <Lock size={12} /> {showPassForm ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          {showPassForm && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)} required placeholder="Senha atual"
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-gray-600 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input type={showPass ? 'text' : 'password'} value={newPass}
                onChange={e => setNewPass(e.target.value)} required placeholder="Nova senha (mínimo 6 caracteres)"
                className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-gray-600 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type={showPass ? 'text' : 'password'} value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)} required placeholder="Confirmar nova senha"
                className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-gray-600 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {passMsg && (
                <p className={`text-xs font-medium ${passMsg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
                  {passMsg.type === 'ok' && <CheckCircle size={12} className="inline mr-1" />}
                  {passMsg.text}
                </p>
              )}
              <button type="submit" disabled={passLoading}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl">
                {passLoading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>

        {/* Info da conta */}
        {user && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">E-mail</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tipo de conta</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ AÇÕES DA CONTA ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conta</h2>
        <div className="space-y-2">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group">
            <LogOut size={17} className="text-gray-400 group-hover:text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-500">Sair da conta</p>
              <p className="text-xs text-gray-400">Encerrar sessão neste dispositivo</p>
            </div>
          </button>
        </div>
      </div>

      {/* ═══ GUIAS ═══ */}
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">Guias passo a passo</h2>
      <div className="space-y-3 mb-6">
        <Guide title="Como obter o Token de Acesso da Meta" steps={TOKEN_STEPS} open={openGuide === 'token'} onToggle={() => toggle('token')} />
        <Guide title="Como encontrar o ID da sua conta de anúncios" steps={ID_STEPS} open={openGuide === 'id'} onToggle={() => toggle('id')} />
      </div>

      {/* ═══ LINKS ÚTEIS ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Links úteis</h2>
        <div className="space-y-2">
          {[
            { label: 'Gerenciador de Anúncios', url: 'https://www.facebook.com/adsmanager' },
            { label: 'Gerenciador de Negócios', url: 'https://business.facebook.com' },
            { label: 'Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer' },
            { label: 'Meta for Developers', url: 'https://developers.facebook.com' },
          ].map(({ label, url }) => (
            <a key={url} href={url} target="_blank" rel="noreferrer"
              className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group">
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
