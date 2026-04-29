'use client'

import { useEffect, useState } from 'react'
import { Smartphone, Plus, Trash2, Wifi, WifiOff, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'

interface WInstance {
  id: string
  instanceName: string
  status: string
  createdAt: string
}

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WInstance[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState('')

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '/api/whatsapp/webhook'

  async function load() {
    setLoading(true)
    const res = await fetch('/api/whatsapp/connect')
    if (res.ok) setInstances(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!newName.trim()) return setError('Dê um nome para a instância')
    setError('')
    setCreating(true)
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName: newName.trim() }),
    })
    if (res.ok) {
      setNewName('')
      setShowForm(false)
      await load()
    } else {
      setError('Erro ao criar instância')
    }
    setCreating(false)
  }

  async function remove(id: string) {
    if (!confirm('Remover esta instância?')) return
    await fetch(`/api/whatsapp/connect?id=${id}`, { method: 'DELETE' })
    await load()
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function statusColor(s: string) {
    if (s === 'open' || s === 'connected') return 'text-green-500'
    if (s === 'connecting')               return 'text-yellow-500'
    return 'text-gray-400'
  }

  function statusLabel(s: string) {
    if (s === 'open' || s === 'connected') return 'Conectado'
    if (s === 'connecting')               return 'Conectando...'
    return 'Desconectado'
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone size={26} className="text-blue-400" />
            WhatsApp
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conecte seu número para receber leads automaticamente
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Como funciona */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-sm">Como funciona?</h2>
        <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>Crie uma instância abaixo com qualquer nome</li>
          <li>Configure o Evolution API com o Webhook URL copiando abaixo</li>
          <li>Conecte o número WhatsApp no painel do Evolution API</li>
          <li>Toda mensagem recebida vira um lead automático no CRM!</li>
        </ol>
      </div>

      {/* Webhook URL */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          URL do Webhook (cole no Evolution API)
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg truncate">
            {webhookUrl}
          </code>
          <button
            onClick={copyWebhook}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shrink-0"
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Instâncias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Instâncias conectadas</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus size={14} />
            Nova instância
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()}
                placeholder="Nome da instância (ex: minha-loja)"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={create}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {creating ? '...' : 'Criar'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : instances.length === 0 ? (
          <div className="p-8 text-center">
            <Smartphone size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma instância criada ainda</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Clique em "Nova instância" para começar</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {instances.map(inst => (
              <li key={inst.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`${statusColor(inst.status)}`}>
                  {inst.status === 'open' || inst.status === 'connected'
                    ? <Wifi size={18} />
                    : <WifiOff size={18} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{inst.instanceName}</p>
                  <p className={`text-xs ${statusColor(inst.status)}`}>{statusLabel(inst.status)}</p>
                </div>
                <button
                  onClick={() => remove(inst.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info Evolution API */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
          Configurar Evolution API
        </h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            <span>Acesse <strong className="text-gray-700 dark:text-gray-300">evolution-api.com</strong> e instale ou use a versão cloud</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            <span>Nas configurações do Vercel, adicione as variáveis <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">EVOLUTION_API_URL</code> e <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">EVOLUTION_API_KEY</code></span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            <span>Cole a URL do Webhook acima no painel do Evolution API, em <strong className="text-gray-700 dark:text-gray-300">Configurações → Webhook</strong></span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
            <span>Conecte o WhatsApp escaneando o QR code no Evolution API</span>
          </div>
        </div>
      </div>
    </div>
  )
}
