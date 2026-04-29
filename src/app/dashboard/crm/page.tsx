'use client'

import { useEffect, useState } from 'react'
import {
  Users, Plus, Phone, MessageSquare, X,
  CheckCircle, Clock, XCircle, AlertCircle,
  TrendingUp, Send, ChevronRight, Trash2,
  Megaphone, Calendar
} from 'lucide-react'

type LeadStatus = 'new' | 'attending' | 'closed' | 'lost'

interface Conversation { id: string; fromMe: boolean; message: string; timestamp: string }
interface Lead {
  id: string; name?: string; phone: string; status: LeadStatus
  adSource?: string; adCampaign?: string; notes?: string
  createdAt: string; updatedAt: string
  conversations: Conversation[]
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  new:       { label: 'Novo',          color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: AlertCircle },
  attending: { label: 'Em atendimento',color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  closed:    { label: 'Fechado',       color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  lost:      { label: 'Perdido',       color: 'text-red-500 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     icon: XCircle },
}

const STATUSES: LeadStatus[] = ['new', 'attending', 'closed', 'lost']

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Lead | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [form, setForm] = useState({ name: '', phone: '', adSource: '', adCampaign: '', notes: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    const res = await fetch('/api/crm/leads')
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
  }

  async function loadConversations(lead: Lead) {
    setSelected(lead)
    const res = await fetch(`/api/crm/conversations?leadId=${lead.id}`)
    const data = await res.json()
    setConversations(data.conversations ?? [])
  }

  async function addLead(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm({ name: '', phone: '', adSource: '', adCampaign: '', notes: '' })
      setShowForm(false)
      loadLeads()
    } finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: LeadStatus) {
    await fetch('/api/crm/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadLeads()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  async function deleteLead(id: string) {
    if (!confirm('Remover este lead?')) return
    await fetch(`/api/crm/leads?id=${id}`, { method: 'DELETE' })
    if (selected?.id === id) setSelected(null)
    loadLeads()
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !newMsg.trim()) return
    await fetch('/api/crm/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selected.id, message: newMsg, fromMe: true }),
    })
    setNewMsg('')
    loadConversations(selected)
  }

  // Métricas
  const total    = leads.length
  const newLeads = leads.filter(l => l.status === 'new').length
  const closed   = leads.filter(l => l.status === 'closed').length
  const lost     = leads.filter(l => l.status === 'lost').length
  const closeRate = total > 0 ? ((closed / total) * 100).toFixed(0) : '0'

  // Fechamentos esta semana
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const closedThisWeek = leads.filter(l => l.status === 'closed' && new Date(l.updatedAt) >= weekAgo).length

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-blue-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CRM & Leads</h1>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-400 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-400/20">
            <Plus size={14} /> Novo lead
          </button>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Total',      value: total,            color: 'text-gray-900 dark:text-white' },
            { label: 'Novos',      value: newLeads,         color: 'text-blue-500' },
            { label: 'Fechados',   value: closed,           color: 'text-green-500' },
            { label: 'Esta semana',value: closedThisWeek,   color: 'text-purple-500' },
          ].map(m => (
            <div key={m.label} className="bg-blue-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Barra de conversão */}
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-gray-800 rounded-xl px-3 py-2">
          <TrendingUp size={14} className="text-blue-400 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Taxa de fechamento:</span>
          <span className="text-xs font-bold text-blue-500">{closeRate}%</span>
          <div className="flex-1 bg-blue-200 dark:bg-gray-700 rounded-full h-1.5 ml-1">
            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${closeRate}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de leads */}
        <div className={`flex flex-col border-r border-blue-100 dark:border-gray-800 bg-white dark:bg-gray-950 ${selected ? 'hidden md:flex w-80' : 'flex w-full md:w-80'}`}>

          {/* Filtros de status */}
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-blue-100 dark:border-gray-800">
            {(['all', ...STATUSES] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s
                    ? 'bg-blue-400 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800'
                }`}>
                {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
                <span className="ml-1 opacity-70">
                  {s === 'all' ? total : leads.filter(l => l.status === s).length}
                </span>
              </button>
            ))}
          </div>

          {/* Formulário rápido */}
          {showForm && (
            <form onSubmit={addLead} className="p-3 border-b border-blue-100 dark:border-gray-800 space-y-2 bg-blue-50/50 dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Adicionar lead manualmente</p>
              <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Telefone (com DDD) *" inputMode="numeric"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do lead"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input value={form.adSource} onChange={e => setForm(f => ({ ...f, adSource: e.target.value }))}
                placeholder="Origem (ex: Facebook, Instagram)"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input value={form.adCampaign} onChange={e => setForm(f => ({ ...f, adCampaign: e.target.value }))}
                placeholder="Nome da campanha"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 bg-blue-400 text-white text-xs font-semibold rounded-lg">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-3 py-2 border border-blue-200 dark:border-gray-700 text-gray-500 text-xs rounded-lg">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Users size={32} className="text-blue-200 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum lead aqui</p>
                <p className="text-xs text-gray-400 mt-1">Os leads do WhatsApp aparecem automaticamente</p>
              </div>
            ) : filtered.map(lead => {
              const sc = STATUS_CONFIG[lead.status]
              const StatusIcon = sc.icon
              const lastMsg = lead.conversations?.[0]
              return (
                <button key={lead.id} onClick={() => loadConversations(lead)}
                  className={`w-full flex items-start gap-3 px-3 py-3 border-b border-blue-50 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors text-left ${selected?.id === lead.id ? 'bg-blue-50 dark:bg-gray-900' : ''}`}>
                  {/* Avatar inicial */}
                  <div className="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
                    {(lead.name ?? lead.phone)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {lead.name ?? lead.phone}
                      </p>
                      <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        <StatusIcon size={9} /> {sc.label}
                      </span>
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg.message}</p>
                    )}
                    {lead.adSource && (
                      <div className="flex items-center gap-1 mt-1">
                        <Megaphone size={9} className="text-blue-400" />
                        <span className="text-[10px] text-blue-400 truncate">{lead.adSource}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel de conversa */}
        {selected ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
            {/* Header do lead */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-100 dark:border-gray-800">
              <button onClick={() => setSelected(null)} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-blue-400">
                <X size={18} />
              </button>
              <div className="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(selected.name ?? selected.phone)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {selected.name ?? selected.phone}
                </p>
                <div className="flex items-center gap-2">
                  <Phone size={10} className="text-gray-400" />
                  <span className="text-xs text-gray-400">{selected.phone}</span>
                  {selected.adCampaign && (
                    <span className="text-[10px] text-blue-400 truncate">· {selected.adCampaign}</span>
                  )}
                </div>
              </div>
              {/* Ações rápidas */}
              <div className="flex items-center gap-1.5">
                <a href={`https://wa.me/55${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="p-2 bg-green-400 hover:bg-green-500 text-white rounded-xl transition-colors" title="Abrir no WhatsApp">
                  <MessageSquare size={14} />
                </a>
                <button onClick={() => deleteLead(selected.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Mudar status */}
            <div className="flex gap-1.5 px-4 py-2 border-b border-blue-50 dark:border-gray-800 overflow-x-auto">
              {STATUSES.map(s => {
                const sc = STATUS_CONFIG[s]
                const Icon = sc.icon
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selected.status === s
                        ? `${sc.bg} ${sc.color} ring-2 ring-offset-1 ring-blue-400`
                        : 'text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800'
                    }`}>
                    <Icon size={11} /> {sc.label}
                  </button>
                )
              })}
            </div>

            {/* Info do anúncio */}
            {(selected.adSource || selected.adCampaign) && (
              <div className="mx-4 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-2">
                <Megaphone size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Origem do lead</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {selected.adSource}{selected.adCampaign ? ` · ${selected.adCampaign}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={32} className="text-blue-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                  <p className="text-xs text-gray-400 mt-1">As mensagens do WhatsApp aparecem aqui automaticamente</p>
                </div>
              ) : conversations.map(c => (
                <div key={c.id} className={`flex ${c.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    c.fromMe
                      ? 'bg-blue-400 text-white rounded-br-sm'
                      : 'bg-blue-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{c.message}</p>
                    <p className={`text-[10px] mt-1 ${c.fromMe ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de mensagem */}
            <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t border-blue-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Escreva uma nota ou mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-gray-700 bg-blue-50/40 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
              <button type="submit" disabled={!newMsg.trim()}
                className="p-2.5 bg-blue-400 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-blue-50/30 dark:bg-gray-950">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Selecione um lead</p>
              <p className="text-sm text-gray-400 mt-1">para ver a conversa e gerenciar o status</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
