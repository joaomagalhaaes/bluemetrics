'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Smartphone, Plus, Trash2, Wifi, WifiOff,
  RefreshCw, Copy, CheckCircle2, QrCode, X, Loader2,
  Bell, MessageCircle, ArrowRight, Cloud, Radio, Settings2
} from 'lucide-react'
import Link from 'next/link'

interface WInstance {
  id: string
  instanceName: string
  status: string
  createdAt: string
}

interface CloudInstance {
  id: string
  instanceName: string
  phone: string | null
  phoneNumberId: string | null
  waBusinessId: string | null
  status: string
  createdAt: string
  _count: { leads: number }
}

interface QRState {
  loading: boolean
  base64: string | null
  code: string | null
  connected: boolean
  error: string | null
}

const INITIAL_QR: QRState = { loading: false, base64: null, code: null, connected: false, error: null }

type Tab = 'cloud_api' | 'evolution'

export default function WhatsAppPage() {
  const [tab, setTab] = useState<Tab>('cloud_api')

  // ═══════════════════════════════════════════════
  // Cloud API State
  // ═══════════════════════════════════════════════
  const [cloudInstances, setCloudInstances] = useState<CloudInstance[]>([])
  const [cloudLoading, setCloudLoading] = useState(true)
  const [showCloudForm, setShowCloudForm] = useState(false)
  const [cloudForm, setCloudForm] = useState({
    phoneNumberId: '',
    waBusinessId: '',
    cloudApiToken: '',
    phone: '',
    instanceName: '',
  })
  const [cloudSaving, setCloudSaving] = useState(false)
  const [cloudError, setCloudError] = useState('')
  const [cloudSuccess, setCloudSuccess] = useState('')

  async function loadCloud() {
    setCloudLoading(true)
    const res = await fetch('/api/whatsapp/cloud-connect')
    if (res.ok) setCloudInstances(await res.json())
    setCloudLoading(false)
  }

  async function saveCloud() {
    setCloudError('')
    setCloudSuccess('')
    if (!cloudForm.phoneNumberId.trim() || !cloudForm.cloudApiToken.trim()) {
      setCloudError('Phone Number ID e Access Token são obrigatórios')
      return
    }
    setCloudSaving(true)
    try {
      const res = await fetch('/api/whatsapp/cloud-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setCloudError(data.error ?? 'Erro ao conectar')
        return
      }
      setCloudSuccess('Conectado com sucesso! As mensagens vão aparecer no CRM.')
      setShowCloudForm(false)
      setCloudForm({ phoneNumberId: '', waBusinessId: '', cloudApiToken: '', phone: '', instanceName: '' })
      await loadCloud()
    } finally {
      setCloudSaving(false)
    }
  }

  async function removeCloud(id: string) {
    if (!confirm('Remover esta conexão?')) return
    await fetch(`/api/whatsapp/cloud-connect?id=${id}`, { method: 'DELETE' })
    await loadCloud()
  }

  // ═══════════════════════════════════════════════
  // Evolution API State (mantido)
  // ═══════════════════════════════════════════════
  const [instances, setInstances] = useState<WInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState('')
  const [activating, setActivating] = useState<string | null>(null)
  const [activatedOk, setActivatedOk] = useState<string | null>(null)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [qrInstance, setQrInstance] = useState<string | null>(null)
  const [qr, setQr] = useState<QRState>(INITIAL_QR)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '/api/whatsapp/webhook'

  const cloudWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/cloud-webhook`
    : '/api/whatsapp/cloud-webhook'

  async function loadEvolution() {
    setLoading(true)
    const res = await fetch('/api/whatsapp/connect')
    if (res.ok) setInstances(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    loadCloud()
    loadEvolution()
  }, [])

  // Evolution functions
  async function activateWebhook(instanceName: string) {
    setActivating(instanceName)
    setActivatedOk(null)
    setActivateError(null)
    const res = await fetch('/api/whatsapp/webhook-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    })
    if (res.ok) {
      setActivatedOk(instanceName)
      setTimeout(() => setActivatedOk(null), 8000)
    } else {
      const data = await res.json()
      setActivateError(data.error || 'Erro ao ativar webhook')
    }
    setActivating(null)
  }

  const fetchQR = useCallback(async (instanceName: string) => {
    setQr(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(`/api/whatsapp/qrcode?instance=${instanceName}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setQr({ loading: false, base64: null, code: null, connected: false, error: data.error ?? 'Erro ao buscar QR code' })
        return
      }
      const base64 = data.base64 ?? data.qrcode?.base64 ?? null
      const code = data.code ?? data.qrcode?.code ?? null
      setQr({ loading: false, base64, code, connected: false, error: null })
    } catch {
      setQr({ loading: false, base64: null, code: null, connected: false, error: 'Não foi possível conectar à Evolution API' })
    }
  }, [])

  const checkStatus = useCallback(async (instanceName: string) => {
    const res = await fetch(`/api/whatsapp/status?instance=${instanceName}`)
    const data = await res.json()
    if (data.state === 'open') {
      setQr(prev => ({ ...prev, connected: true }))
      await loadEvolution()
    }
    return data.state
  }, [])

  async function openQR(instanceName: string) {
    setQrInstance(instanceName)
    setQr(INITIAL_QR)
    await fetchQR(instanceName)
  }

  useEffect(() => {
    if (!qrInstance || qr.connected) return
    const interval = setInterval(() => checkStatus(qrInstance), 5000)
    return () => clearInterval(interval)
  }, [qrInstance, qr.connected, checkStatus])

  useEffect(() => {
    if (!qrInstance || qr.connected || qr.error) return
    const timer = setTimeout(() => fetchQR(qrInstance), 30000)
    return () => clearTimeout(timer)
  }, [qrInstance, qr, fetchQR])

  async function closeModal() {
    setQrInstance(null)
    setQr(INITIAL_QR)
    await loadEvolution()
  }

  async function createEvolution() {
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
      await loadEvolution()
      openQR(inst.instanceName)
    } else {
      setFormError('Erro ao criar instância')
    }
    setCreating(false)
  }

  async function removeEvolution(id: string) {
    if (!confirm('Remover esta instância?')) return
    await fetch(`/api/whatsapp/connect?id=${id}`, { method: 'DELETE' })
    await loadEvolution()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function statusColor(s: string) {
    if (s === 'open' || s === 'connected') return 'text-green-500'
    if (s === 'connecting') return 'text-yellow-500'
    return 'text-gray-400'
  }
  function statusLabel(s: string) {
    if (s === 'open' || s === 'connected') return 'Conectado'
    if (s === 'connecting') return 'Conectando...'
    return 'Desconectado'
  }
  function isConnected(s: string) {
    return s === 'open' || s === 'connected'
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
            Receba leads e mensagens automaticamente no CRM
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('cloud_api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'cloud_api'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          <Cloud size={16} />
          Cloud API (Oficial)
        </button>
        <button
          onClick={() => setTab('evolution')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'evolution'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          <Radio size={16} />
          Evolution API
        </button>
      </div>

      {/* Como funciona */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm flex items-center gap-2">
          <MessageCircle size={16} className="text-green-500" />
          Como funciona o fluxo
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">Cliente manda mensagem</span>
          <ArrowRight size={12} className="text-gray-400" />
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">WhatsApp recebe</span>
          <ArrowRight size={12} className="text-gray-400" />
          <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">BlueMetrics cria lead</span>
          <ArrowRight size={12} className="text-gray-400" />
          <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg border border-green-200 dark:border-green-700 font-medium">Aparece no CRM ✓</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TAB: CLOUD API                         */}
      {/* ═══════════════════════════════════════ */}
      {tab === 'cloud_api' && (
        <>
          {/* Vantagens */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">Por que usar a Cloud API?</p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>✅ API oficial da Meta — sem risco de ban</li>
              <li>✅ Gratuita (paga apenas por conversa iniciada por você)</li>
              <li>✅ Não precisa de servidor extra</li>
              <li>✅ Estável e confiável para produção</li>
            </ul>
          </div>

          {cloudSuccess && (
            <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">{cloudSuccess}</p>
              <button onClick={() => setCloudSuccess('')} className="ml-auto text-green-400 hover:text-green-600"><X size={14} /></button>
            </div>
          )}

          {/* Lista de instâncias Cloud */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Números conectados</h2>
              <div className="flex items-center gap-2">
                <button onClick={loadCloud} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setShowCloudForm(v => !v)} className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
                  <Plus size={14} />
                  Conectar número
                </button>
              </div>
            </div>

            {/* Form para conectar */}
            {showCloudForm && (
              <div className="px-4 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800 space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Dados do Meta for Developers
                </p>

                <div>
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mb-1">Phone Number ID *</label>
                  <input
                    value={cloudForm.phoneNumberId}
                    onChange={e => setCloudForm(f => ({ ...f, phoneNumberId: e.target.value }))}
                    placeholder="Ex: 123456789012345"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mb-1">Access Token permanente *</label>
                  <input
                    value={cloudForm.cloudApiToken}
                    onChange={e => setCloudForm(f => ({ ...f, cloudApiToken: e.target.value }))}
                    placeholder="Token do System User"
                    type="password"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mb-1">WhatsApp Business Account ID (opcional)</label>
                  <input
                    value={cloudForm.waBusinessId}
                    onChange={e => setCloudForm(f => ({ ...f, waBusinessId: e.target.value }))}
                    placeholder="Ex: 987654321098765"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mb-1">Número (exibição)</label>
                    <input
                      value={cloudForm.phone}
                      onChange={e => setCloudForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="5511999999999"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mb-1">Nome da instância</label>
                    <input
                      value={cloudForm.instanceName}
                      onChange={e => setCloudForm(f => ({ ...f, instanceName: e.target.value }))}
                      placeholder="Ex: atendimento"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {cloudError && (
                  <p className="text-xs text-red-500 font-medium">{cloudError}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={saveCloud} disabled={cloudSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-colors">
                    {cloudSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {cloudSaving ? 'Validando...' : 'Conectar'}
                  </button>
                  <button onClick={() => { setShowCloudForm(false); setCloudError('') }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-xl transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {cloudLoading ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={24} className="animate-spin" />
                Carregando...
              </div>
            ) : cloudInstances.length === 0 && !showCloudForm ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Cloud size={30} className="text-blue-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">Nenhum número conectado</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">Configure a Cloud API para começar a receber mensagens</p>
                <button onClick={() => setShowCloudForm(true)} className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                  + Conectar via Cloud API
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cloudInstances.map(inst => (
                  <li key={inst.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-green-500">
                        <Wifi size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{inst.instanceName}</p>
                        <p className="text-xs text-gray-400">
                          {inst.phone || inst.phoneNumberId} · {inst._count.leads} lead{inst._count.leads !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                        Conectado
                      </span>
                      <button onClick={() => removeCloud(inst.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Webhook URL + Instruções */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Configuração no Meta for Developers
            </p>
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">1. URL do Webhook:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg truncate">
                    {cloudWebhookUrl}
                  </code>
                  <button onClick={() => copyToClipboard(cloudWebhookUrl)} className="px-3 py-2 font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shrink-0">
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">2. Verify Token:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg">
                    bluemetrics_verify_token
                  </code>
                  <button onClick={() => copyToClipboard('bluemetrics_verify_token')} className="px-3 py-2 font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shrink-0">
                    Copiar
                  </button>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">3. Campos do webhook:</p>
                <p>Marque: <strong>messages</strong></p>
              </div>
            </div>
          </div>

          {/* Passo a passo */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
              <Settings2 size={13} />
              Passo a passo — Meta for Developers
            </p>
            <ol className="text-xs text-amber-600 dark:text-amber-400 space-y-1.5 list-decimal list-inside">
              <li>Acesse <strong>developers.facebook.com</strong> → Seus Apps</li>
              <li>Crie ou selecione um app tipo <strong>Business</strong></li>
              <li>Adicione o produto <strong>WhatsApp</strong></li>
              <li>Em <strong>Configuração da API</strong>, copie o <em>Phone Number ID</em></li>
              <li>Crie um <strong>System User</strong> com permissão <em>whatsapp_business_messaging</em></li>
              <li>Gere um <strong>token permanente</strong> para esse System User</li>
              <li>Em <strong>Webhooks</strong>, configure a URL e o Verify Token acima</li>
              <li>Assine o campo <strong>messages</strong></li>
              <li>Pronto! Cole o Phone Number ID e o Token aqui em cima</li>
            </ol>
          </div>

          {cloudInstances.length > 0 && (
            <div className="mt-4 text-center">
              <Link href="/dashboard/crm" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                <MessageCircle size={16} />
                Ver leads no CRM
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* TAB: EVOLUTION API                     */}
      {/* ═══════════════════════════════════════ */}
      {tab === 'evolution' && (
        <>
          {activateError && (
            <div className="mb-4 px-4 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Configure o webhook manualmente:</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{activateError}</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg truncate">
                  {webhookUrl}
                </code>
                <button onClick={() => copyToClipboard(webhookUrl)} className="px-3 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shrink-0">
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <button onClick={() => setActivateError(null)} className="mt-2 text-xs text-amber-500 hover:text-amber-600 font-medium">Fechar</button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Números (Evolution)</h2>
              <div className="flex items-center gap-2">
                <button onClick={loadEvolution} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs font-medium text-green-500 hover:text-green-600">
                  <Plus size={14} />
                  Adicionar número
                </button>
              </div>
            </div>

            {showForm && (
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">
                  Nome para identificar este número
                </p>
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createEvolution()}
                    placeholder="Ex: atendimento"
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button onClick={createEvolution} disabled={creating} className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : 'Criar'}
                  </button>
                </div>
                {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={24} className="animate-spin" />
                Carregando...
              </div>
            ) : instances.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Smartphone size={30} className="text-green-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">Nenhum número conectado</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">Requer Evolution API rodando</p>
                <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  + Conectar WhatsApp
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {instances.map(inst => (
                  <li key={inst.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={statusColor(inst.status)}>
                        {isConnected(inst.status) ? <Wifi size={20} /> : <WifiOff size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{inst.instanceName}</p>
                        <p className={`text-xs font-medium ${statusColor(inst.status)}`}>{statusLabel(inst.status)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isConnected(inst.status) && (
                          <button onClick={() => openQR(inst.instanceName)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                            <QrCode size={13} />
                            Conectar
                          </button>
                        )}
                        <button onClick={() => removeEvolution(inst.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isConnected(inst.status) && (
                      <div className="mt-3 ml-8 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          Conectado! Ative o recebimento:
                        </p>
                        <button
                          onClick={() => activateWebhook(inst.instanceName)}
                          disabled={activating === inst.instanceName}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors w-full justify-center ${
                            activatedOk === inst.instanceName
                              ? 'bg-green-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          {activating === inst.instanceName ? (
                            <><Loader2 size={13} className="animate-spin" /> Ativando...</>
                          ) : activatedOk === inst.instanceName ? (
                            <><CheckCircle2 size={13} /> Ativado!</>
                          ) : (
                            <><Bell size={13} /> Ativar webhook</>
                          )}
                        </button>
                        {activatedOk === inst.instanceName && (
                          <Link href="/dashboard/crm" className="mt-2 flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium hover:underline">
                            Ver leads no CRM <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Webhook URL Evolution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">URL do Webhook (Evolution API)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg truncate">
                {webhookUrl}
              </code>
              <button onClick={() => copyToClipboard(webhookUrl)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shrink-0">
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ──── MODAL QR CODE (Evolution) ──── */}
      {qrInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-white text-base">Conectar WhatsApp</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{qrInstance}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-center">
              {qr.connected ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 size={44} className="text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">Conectado!</p>
                  <p className="text-sm text-gray-500 text-center">Agora ative o recebimento de mensagens.</p>
                  <button onClick={closeModal} className="mt-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    Continuar
                  </button>
                </div>
              ) : qr.loading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 size={36} className="animate-spin text-green-400" />
                  <p className="text-sm text-gray-500">Gerando QR code...</p>
                </div>
              ) : qr.error ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <WifiOff size={28} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Erro ao gerar QR</p>
                  <p className="text-xs text-gray-400">{qr.error}</p>
                  <button onClick={() => fetchQR(qrInstance)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                    <RefreshCw size={14} /> Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Abra o <strong>WhatsApp</strong> → Dispositivos conectados → Conectar
                  </p>
                  <div className="w-56 h-56 mx-auto bg-white rounded-2xl border-4 border-gray-100 dark:border-gray-700 overflow-hidden flex items-center justify-center shadow-lg">
                    {qr.base64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qr.base64.startsWith('data:') ? qr.base64 : `data:image/png;base64,${qr.base64}`}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <QrCode size={60} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">QR não disponível</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <Loader2 size={12} className="animate-spin" />
                    Aguardando... QR atualiza a cada 30s
                  </div>
                  <button onClick={() => fetchQR(qrInstance)} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-1.5 text-xs font-medium text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                    <RefreshCw size={13} /> Atualizar QR
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
