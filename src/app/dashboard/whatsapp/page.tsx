'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Smartphone, Plus, Trash2, Wifi, WifiOff,
  RefreshCw, Copy, CheckCircle2, QrCode, X, Loader2
} from 'lucide-react'

interface WInstance {
  id: string
  instanceName: string
  status: string
  createdAt: string
}

interface QRState {
  loading: boolean
  base64: string | null   // "data:image/png;base64,..."
  code: string | null     // texto para gerar QR (fallback)
  connected: boolean
  error: string | null
}

const INITIAL_QR: QRState = { loading: false, base64: null, code: null, connected: false, error: null }

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WInstance[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [formError, setFormError] = useState('')

  // QR modal
  const [qrInstance, setQrInstance] = useState<string | null>(null)
  const [qr, setQr]                 = useState<QRState>(INITIAL_QR)

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

  // Busca QR code e faz polling do status
  const fetchQR = useCallback(async (instanceName: string) => {
    setQr(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res  = await fetch(`/api/whatsapp/qrcode?instance=${instanceName}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setQr({ loading: false, base64: null, code: null, connected: false, error: data.error ?? 'Erro ao buscar QR code' })
        return
      }

      // Evolution API retorna base64 direto ou dentro de .qrcode.base64
      const base64 = data.base64 ?? data.qrcode?.base64 ?? null
      const code   = data.code   ?? data.qrcode?.code   ?? null

      setQr({ loading: false, base64, code, connected: false, error: null })
    } catch {
      setQr({ loading: false, base64: null, code: null, connected: false, error: 'Não foi possível conectar à Evolution API' })
    }
  }, [])

  const checkStatus = useCallback(async (instanceName: string) => {
    const res  = await fetch(`/api/whatsapp/status?instance=${instanceName}`)
    const data = await res.json()
    if (data.state === 'open') {
      setQr(prev => ({ ...prev, connected: true }))
      await load()
    }
    return data.state
  }, [])

  // Abre o modal e inicia polling
  async function openQR(instanceName: string) {
    setQrInstance(instanceName)
    setQr(INITIAL_QR)
    await fetchQR(instanceName)
  }

  // Polling: verifica status a cada 5s enquanto modal está aberto
  useEffect(() => {
    if (!qrInstance || qr.connected) return
    const interval = setInterval(() => checkStatus(qrInstance), 5000)
    return () => clearInterval(interval)
  }, [qrInstance, qr.connected, checkStatus])

  // Auto-refresh QR a cada 30s (QR expira)
  useEffect(() => {
    if (!qrInstance || qr.connected || qr.error) return
    const timer = setTimeout(() => fetchQR(qrInstance), 30000)
    return () => clearTimeout(timer)
  }, [qrInstance, qr, fetchQR])

  function closeModal() {
    setQrInstance(null)
    setQr(INITIAL_QR)
    load()
  }

  async function create() {
    if (!newName.trim()) return setFormError('Dê um nome para a instância')
    setFormError('')
    setCreating(true)
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName: newName.trim() }),
    })
    if (res.ok) {
      const inst = await res.json()
      setNewName('')
      setShowForm(false)
      await load()
      // Abre QR automaticamente
      openQR(inst.instanceName)
    } else {
      setFormError('Erro ao criar instância')
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
  function statusBg(s: string) {
    if (s === 'open' || s === 'connected') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    if (s === 'connecting')               return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
    return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone size={26} className="text-green-500" />
            Conectar WhatsApp
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Escaneie o QR code para receber leads automáticos no CRM
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Atualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Webhook URL */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          URL do Webhook
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg truncate">
            {webhookUrl}
          </code>
          <button onClick={copyWebhook} className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shrink-0">
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Instâncias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Números conectados</h2>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors">
            <Plus size={14} />
            Adicionar número
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
              Dê um nome para identificar este número (ex: loja-centro, atendimento)
            </p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()}
                placeholder="Ex: minha-loja"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button onClick={create} disabled={creating} className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Criar'}
              </button>
            </div>
            {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin" />
            Carregando...
          </div>
        ) : instances.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Smartphone size={30} className="text-green-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">Nenhum número conectado</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 mb-4">Clique em "Adicionar número" para começar</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
            >
              + Conectar WhatsApp
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {instances.map(inst => (
              <li key={inst.id} className={`flex items-center gap-3 px-4 py-3.5 border-l-4 ${statusBg(inst.status)}`}>
                <div className={statusColor(inst.status)}>
                  {inst.status === 'open' || inst.status === 'connected'
                    ? <Wifi size={20} />
                    : <WifiOff size={20} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{inst.instanceName}</p>
                  <p className={`text-xs font-medium ${statusColor(inst.status)}`}>{statusLabel(inst.status)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {inst.status !== 'open' && inst.status !== 'connected' && (
                    <button
                      onClick={() => openQR(inst.instanceName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <QrCode size={13} />
                      Conectar
                    </button>
                  )}
                  <button
                    onClick={() => remove(inst.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ──── MODAL QR CODE ──── */}
      {qrInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-white text-base">Conectar WhatsApp</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{qrInstance}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 text-center">

              {/* Conectado! */}
              {qr.connected ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 size={44} className="text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">WhatsApp Conectado!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Agora toda mensagem recebida vira um lead no CRM automaticamente.
                  </p>
                  <button onClick={closeModal} className="mt-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    Fechar
                  </button>
                </div>

              /* Loading QR */
              ) : qr.loading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 size={36} className="animate-spin text-blue-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerando QR code...</p>
                </div>

              /* Erro */
              ) : qr.error ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <WifiOff size={28} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Não foi possível gerar o QR code</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{qr.error}</p>
                  <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-left text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <p className="font-semibold">Para usar o QR code você precisa:</p>
                    <p>1. Ter o <strong>Evolution API</strong> instalado</p>
                    <p>2. Adicionar <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">EVOLUTION_API_URL</code> e <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">EVOLUTION_API_KEY</code> nas variáveis do Vercel</p>
                  </div>
                  <button onClick={() => fetchQR(qrInstance)} className="mt-1 flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                    <RefreshCw size={14} />
                    Tentar novamente
                  </button>
                </div>

              /* QR code */
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Abra o <strong>WhatsApp</strong> no celular → <br />
                    <span className="text-xs">Dispositivos conectados → Conectar dispositivo</span>
                  </p>

                  {/* Imagem QR */}
                  <div className="relative inline-block">
                    <div className="w-56 h-56 mx-auto bg-white rounded-2xl border-4 border-gray-100 dark:border-gray-700 overflow-hidden flex items-center justify-center shadow-lg">
                      {qr.base64 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qr.base64.startsWith('data:') ? qr.base64 : `data:image/png;base64,${qr.base64}`}
                          alt="QR Code WhatsApp"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <QrCode size={60} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400">QR não disponível</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <Loader2 size={12} className="animate-spin" />
                    Aguardando conexão... O QR atualiza a cada 30s
                  </div>

                  <button
                    onClick={() => fetchQR(qrInstance)}
                    className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <RefreshCw size={13} />
                    Atualizar QR code
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
