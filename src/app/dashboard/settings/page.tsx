'use client'

import { useState } from 'react'
import { Settings, ChevronDown, ChevronUp, ExternalLink, Copy, Check, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

type Step = { num: string; title: string; desc: string; action?: string; link?: string; tip?: string }

const TOKEN_STEPS: Step[] = [
  {
    num: '1',
    title: 'Acesse o Meta for Developers',
    desc: 'Abra o navegador e acesse o site de desenvolvedores da Meta.',
    action: 'Acessar site',
    link: 'https://developers.facebook.com',
    tip: 'Faça login com o mesmo Facebook que gerencia sua conta de anúncios.',
  },
  {
    num: '2',
    title: 'Crie um aplicativo (App)',
    desc: 'No menu superior, clique em "Meus Apps" → "Criar App". Escolha o tipo "Empresa" e dê qualquer nome, como "Meu Dashboard".',
    tip: 'Não precisa publicar o app. É apenas para gerar o token.',
  },
  {
    num: '3',
    title: 'Vá para o Graph API Explorer',
    desc: 'No painel do seu app, clique em "Ferramentas" no menu superior → "Graph API Explorer".',
    action: 'Abrir Graph Explorer',
    link: 'https://developers.facebook.com/tools/explorer',
    tip: 'O Explorer é onde você gera o token de acesso.',
  },
  {
    num: '4',
    title: 'Selecione seu app e gere o token',
    desc: 'No Graph API Explorer: (1) No campo "Meta App", selecione o app que você criou. (2) Clique em "Gerar Token de Acesso". (3) Autorize quando solicitado.',
    tip: 'Uma janela pop-up vai aparecer pedindo permissão. Clique em "Continuar".',
  },
  {
    num: '5',
    title: 'Adicione as permissões necessárias',
    desc: 'Clique em "Adicionar permissão" e marque: ads_read e ads_management. Essas permissões permitem que o BlueMetrics leia as métricas da sua conta.',
    tip: 'Sem essas permissões, o token não consegue acessar os dados dos anúncios.',
  },
  {
    num: '6',
    title: 'Copie o token gerado',
    desc: 'O token aparece no campo "Token de Acesso". Copie ele inteiro (é um texto bem longo, com letras e números). Cole na aba "Minha Conta" do BlueMetrics.',
    tip: 'O token de acesso temporário dura apenas algumas horas. Para um token permanente, gere um "token de longa duração" nas configurações do app.',
  },
]

const ID_STEPS: Step[] = [
  {
    num: '1',
    title: 'Acesse o Gerenciador de Negócios',
    desc: 'Abra business.facebook.com e faça login.',
    action: 'Abrir',
    link: 'https://business.facebook.com',
  },
  {
    num: '2',
    title: 'Vá em Configurações',
    desc: 'No menu lateral esquerdo, clique em "Configurações" (ícone de engrenagem).',
  },
  {
    num: '3',
    title: 'Encontre sua Conta de Anúncios',
    desc: 'Clique em "Contas de Anúncios" → selecione sua conta. O ID de 15 dígitos aparece abaixo do nome da conta (ex: 123456789012345).',
    tip: 'O ID também aparece na URL quando você está dentro do Gerenciador de Anúncios.',
  },
]

const PIXEL_STEPS: Step[] = [
  {
    num: '1',
    title: 'Abra o Gerenciador de Eventos',
    desc: 'Acesse business.facebook.com → Gerenciador de Eventos.',
    action: 'Abrir',
    link: 'https://business.facebook.com/events_manager',
  },
  {
    num: '2',
    title: 'Crie ou encontre seu Pixel',
    desc: 'Clique em "Conectar fonte de dados" → "Web" → "Pixel da Meta". Nomeie seu pixel e clique em Continuar.',
  },
  {
    num: '3',
    title: 'Instale o Pixel no seu site',
    desc: 'Copie o código do Pixel e cole no <head> do seu site. Se usar WordPress, Shopify ou Wix, use as integrações nativas.',
    tip: 'Após instalar, o Pixel começa a registrar visitas em até 20 minutos.',
  },
  {
    num: '4',
    title: 'Copie o ID do Pixel',
    desc: 'No Gerenciador de Eventos, o ID do Pixel aparece abaixo do nome (ex: 123456789). Cole esse ID na aba "Minha Conta" do BlueMetrics.',
  },
]

function Guide({ title, steps, open, onToggle }: {
  title: string
  steps: Step[]
  open: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState('')

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

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
                <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm shadow-blue-400/30 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  {step.tip && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-blue-600 dark:text-blue-400">💡 {step.tip}</p>
                    </div>
                  )}
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-500 font-medium">
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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [openGuide, setOpenGuide] = useState<string | null>('token')

  const toggle = (key: string) => setOpenGuide(v => v === key ? null : key)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={22} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Guias e preferências do BlueMetrics</p>
        </div>
      </div>

      {/* Aparência */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 mb-5 shadow-sm">
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

      {/* Guias */}
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">📖 Guias passo a passo</h2>
      <div className="space-y-3 mb-6">
        <Guide
          title="🔑 Como obter o Token de Acesso da Meta"
          steps={TOKEN_STEPS}
          open={openGuide === 'token'}
          onToggle={() => toggle('token')}
        />
        <Guide
          title="🆔 Como encontrar o ID da sua conta de anúncios"
          steps={ID_STEPS}
          open={openGuide === 'id'}
          onToggle={() => toggle('id')}
        />
        <Guide
          title="⚡ Como configurar e usar o Pixel da Meta"
          steps={PIXEL_STEPS}
          open={openGuide === 'pixel'}
          onToggle={() => toggle('pixel')}
        />
      </div>

      {/* Links úteis */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Links úteis</h2>
        <div className="space-y-2">
          {[
            { label: 'Gerenciador de Anúncios', url: 'https://www.facebook.com/adsmanager' },
            { label: 'Gerenciador de Negócios', url: 'https://business.facebook.com' },
            { label: 'Graph API Explorer',      url: 'https://developers.facebook.com/tools/explorer' },
            { label: 'Gerenciador de Eventos (Pixel)', url: 'https://business.facebook.com/events_manager' },
            { label: 'Meta for Developers',     url: 'https://developers.facebook.com' },
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
