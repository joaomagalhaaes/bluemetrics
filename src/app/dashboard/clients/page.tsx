'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Key, ChevronDown, ChevronUp, Building2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

interface Client {
  id: string; name: string; adAccountId: string
  hasToken: boolean; createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTokenGuide, setShowTokenGuide] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', adAccountId: '', accessToken: '', appId: '', appSecret: '' })
  // Edição de token
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [newToken, setNewToken] = useState('')
  const [savingToken, setSavingToken] = useState(false)

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const res = await fetch('/api/clients')
    setClients(await res.json())
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setForm({ name: '', adAccountId: '', accessToken: '', appId: '', appSecret: '' })
      setShowForm(false)
      loadClients()
    } finally { setLoading(false) }
  }

  async function handleUpdateToken(id: string) {
    setSavingToken(true)
    try {
      await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accessToken: newToken }),
      })
      setEditingToken(null)
      setNewToken('')
      loadClients()
    } finally { setSavingToken(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conta?')) return
    await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
    loadClients()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Minha Conta</h1>
          <p className="text-sm text-gray-400">Gerencie sua conta de anúncios</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-400/20">
          <Plus size={15} /> Adicionar
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Conectar conta de anúncios</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da empresa</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Minha Loja"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID da conta de anúncios <span className="text-red-400">*</span></label>
                <a href="https://business.facebook.com" target="_blank" rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-500 flex items-center gap-1">
                  <ExternalLink size={11} /> Onde encontro?
                </a>
              </div>
              <input required value={form.adAccountId} onChange={e => setForm(f => ({ ...f, adAccountId: e.target.value }))}
                placeholder="Ex: 123456789012345" inputMode="numeric"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-mono" />
              <p className="text-xs text-gray-400 mt-1">
                Encontre em: Gerenciador de Negócios → Configurações → Contas de Anúncios
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Token de Acesso</label>
                <button type="button" onClick={() => setShowTokenGuide(v => !v)}
                  className="text-xs text-blue-400 hover:text-blue-500 flex items-center gap-1">
                  <Key size={11} /> {showTokenGuide ? 'Fechar guia' : 'Como obter?'}
                </button>
              </div>

              {showTokenGuide && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">Como obter seu Token de Acesso:</p>
                  <ol className="space-y-2">
                    {[
                      { step: '1', text: 'Acesse developers.facebook.com', link: 'https://developers.facebook.com' },
                      { step: '2', text: 'Clique em "Meus Apps" → "Criar App" → escolha "Empresa"' },
                      { step: '3', text: 'Vá em "Ferramentas" → "Graph API Explorer"', link: 'https://developers.facebook.com/tools/explorer' },
                      { step: '4', text: 'Selecione seu app → clique "Gerar Token de Acesso"' },
                      { step: '5', text: 'Adicione as permissões: ads_read e ads_management' },
                      { step: '6', text: 'Copie o token gerado e cole aqui abaixo' },
                    ].map(({ step, text, link }) => (
                      <li key={step} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                        <span className="w-4 h-4 bg-blue-400 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{step}</span>
                        <span>{text}{link && <a href={link} target="_blank" rel="noreferrer" className="ml-1 underline">abrir</a>}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <input value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="Cole seu token aqui..."
                className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-mono" />
              <p className="text-xs text-gray-400 mt-1">Sem o token, serão exibidos dados de exemplo.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-blue-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de contas */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={28} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma conta conectada</h2>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Adicione sua conta de anúncios para ver os resultados reais dos seus anúncios.
          </p>
          <button onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl">
            Conectar conta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 p-4">
                <div className="w-11 h-11 bg-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-400/20">
                  <span className="text-white font-bold">{client.name[0]?.toUpperCase() ?? 'A'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{client.name || 'Minha Empresa'}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {client.adAccountId}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {client.hasToken ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                      <CheckCircle2 size={11} /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                      <AlertCircle size={11} /> Sem token
                    </span>
                  )}
                  <button onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400">
                    {expandedId === client.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button onClick={() => handleDelete(client.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expandedId === client.id && (
                <div className="px-4 pb-4 border-t border-blue-50 dark:border-gray-800 pt-3 space-y-3">
                  {!client.hasToken && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Como ativar dados reais</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                        Seu token de acesso ainda não foi configurado. Sem ele, o BlueMetrics exibe dados de exemplo.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50/50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-400 mb-0.5">ID da conta</p>
                      <p className="font-mono text-gray-700 dark:text-gray-300 break-all">{client.adAccountId}</p>
                    </div>
                    <div className="bg-blue-50/50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-400 mb-0.5">Status do token</p>
                      <p className={`font-semibold ${client.hasToken ? 'text-green-500' : 'text-amber-500'}`}>
                        {client.hasToken ? 'Configurado' : 'Pendente'}
                      </p>
                    </div>
                  </div>

                  {/* Atualizar token */}
                  {editingToken === client.id ? (
                    <div className="space-y-2">
                      <input value={newToken} onChange={e => setNewToken(e.target.value)}
                        placeholder="Cole o novo token aqui..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateToken(client.id)} disabled={savingToken || !newToken}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg">
                          {savingToken ? 'Salvando...' : 'Salvar token'}
                        </button>
                        <button onClick={() => { setEditingToken(null); setNewToken('') }}
                          className="px-3 py-1.5 text-xs text-gray-500">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEditingToken(client.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                      <Key size={12} /> {client.hasToken ? 'Atualizar token' : 'Adicionar token'}
                    </button>
                  )}

                  <p className="text-xs text-gray-400">Cadastrado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
