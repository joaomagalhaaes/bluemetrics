'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, User, Scissors, DollarSign, StickyNote,
  CalendarPlus, CheckCircle2, X, Trash2, Loader2
} from 'lucide-react'

interface Appointment {
  id: string
  clientName: string
  service: string | null
  value: number
  date: string
  notes: string | null
  status: string
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const STATUS_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  scheduled:  { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', dot: 'bg-blue-400', label: 'Agendado' },
  completed:  { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', dot: 'bg-green-400', label: 'Realizado' },
  cancelled:  { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', dot: 'bg-red-400', label: 'Cancelado' },
}

export default function CalendarioPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ clientName: '', service: '', value: '', date: '', time: '', notes: '' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/appointments?period=all')
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments)
      }
    } finally { setLoading(false) }
  }

  // Gera os dias do calendário (incluindo dias do mês anterior/próximo para preencher)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: { day: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string }[] = []

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const m = month - 1 < 0 ? 11 : month - 1
      const y = month - 1 < 0 ? year - 1 : year
      days.push({ day: d, month: m, year: y, isCurrentMonth: false, dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month, year, isCurrentMonth: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Dias do próximo mês para completar 6 semanas
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = month + 1 > 11 ? 0 : month + 1
      const y = month + 1 > 11 ? year + 1 : year
      days.push({ day: d, month: m, year: y, isCurrentMonth: false, dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    return days
  }, [year, month])

  // Agrupa agendamentos por data
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments.forEach(a => {
      const dateStr = a.date.slice(0, 10)
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(a)
    })
    // Ordena por hora dentro de cada dia
    Object.values(map).forEach(arr => arr.sort((a, b) => a.date.localeCompare(b.date)))
    return map
  }, [appointments])

  // Agendamentos do dia selecionado
  const selectedAppointments = selectedDate ? (appointmentsByDate[selectedDate] ?? []) : []

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToday() { setCurrentDate(new Date()); setSelectedDate(todayStr) }

  function openFormForDate(dateStr: string) {
    setSelectedDate(dateStr)
    setForm({ clientName: '', service: '', value: '', date: dateStr, time: '09:00', notes: '' })
    setShowForm(true)
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      const dateTime = `${form.date}T${form.time}:00`
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          service: form.service || null,
          value: form.value,
          date: dateTime,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ clientName: '', service: '', value: '', date: '', time: '', notes: '' })
        await loadAll()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Erro ao criar agendamento')
      }
    } finally { setFormLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await loadAll()
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Remover este agendamento?')) return
    await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
    await loadAll()
  }

  const fmt = {
    currency: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    time: (dateStr: string) => {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    },
    fullDate: (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00')
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    },
  }

  // Contadores do mês
  const monthAppointments = appointments.filter(a => {
    const d = new Date(a.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const monthScheduled = monthAppointments.filter(a => a.status === 'scheduled').length
  const monthCompleted = monthAppointments.filter(a => a.status === 'completed').length
  const monthTotal = monthAppointments.length

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <CalendarIcon size={22} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calendário</h1>
            <p className="text-sm text-gray-400">Seus agendamentos organizados por data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Hoje
          </button>
          <button onClick={() => openFormForDate(selectedDate ?? todayStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <CalendarPlus size={13} />
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Contadores do mês */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-gray-800 p-3 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{monthTotal}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Total no mês</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-gray-800 p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{monthScheduled}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Agendados</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-gray-800 p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{monthCompleted}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Realizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ═══ CALENDÁRIO ═══ */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden">
          {/* Navegação do mês */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors">
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors">
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-blue-50 dark:border-gray-800">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayAppts = appointmentsByDate[day.dateStr] ?? []
                const isToday = day.dateStr === todayStr
                const isSelected = day.dateStr === selectedDate
                const hasScheduled = dayAppts.some(a => a.status === 'scheduled')
                const hasCompleted = dayAppts.some(a => a.status === 'completed')
                const hasCancelled = dayAppts.some(a => a.status === 'cancelled')

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`relative min-h-[70px] sm:min-h-[80px] p-1.5 border-b border-r border-blue-50 dark:border-gray-800 text-left transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 ${
                      !day.isCurrentMonth ? 'opacity-30' : ''
                    } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-inset' : ''}`}
                  >
                    <span className={`text-xs font-semibold block mb-0.5 ${
                      isToday
                        ? 'w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day.day}
                    </span>

                    {/* Indicadores de agendamentos */}
                    {dayAppts.length > 0 && (
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map(a => (
                          <div key={a.id} className={`text-[8px] leading-tight px-1 py-0.5 rounded truncate font-medium ${
                            a.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            a.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            {fmt.time(a.date)} {a.clientName.split(' ')[0]}
                          </div>
                        ))}
                        {dayAppts.length > 2 && (
                          <p className="text-[8px] text-gray-400 px-1">+{dayAppts.length - 2} mais</p>
                        )}
                      </div>
                    )}

                    {/* Dots no canto */}
                    {dayAppts.length > 0 && (
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        {hasScheduled && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        {hasCancelled && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legenda */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-t border-blue-50 dark:border-gray-800">
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-400" /> Agendado</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-green-400" /> Realizado</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400" /> Cancelado</span>
          </div>
        </div>

        {/* ═══ PAINEL LATERAL — DETALHES DO DIA ═══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 overflow-hidden h-fit">
          {selectedDate ? (
            <>
              <div className="px-5 py-3 border-b border-blue-100 dark:border-gray-800 bg-blue-50/50 dark:bg-gray-800/50">
                <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  {fmt.fullDate(selectedDate)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {selectedAppointments.length} agendamento{selectedAppointments.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Botão novo agendamento no dia */}
              <div className="px-4 py-3 border-b border-blue-50 dark:border-gray-800">
                <button onClick={() => openFormForDate(selectedDate)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  <CalendarPlus size={13} /> Agendar neste dia
                </button>
              </div>

              {/* Form inline */}
              {showForm && (
                <form onSubmit={addAppointment} className="px-4 py-3 border-b border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><User size={10} /> Nome da cliente *</label>
                    <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="Ex: Maria Silva"
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><Scissors size={10} /> Procedimento</label>
                    <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                      placeholder="Ex: Corte, Manicure, Consulta..."
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><DollarSign size={10} /> Valor (R$) *</label>
                      <input required type="number" step="0.01" min="0" value={form.value}
                        onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                        placeholder="150.00"
                        className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> Horário *</label>
                      <input required type="time" value={form.time}
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><StickyNote size={10} /> Observações</label>
                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Anotação opcional..."
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={formLoading}
                      className="flex-1 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1">
                      {formLoading ? <><Loader2 size={12} className="animate-spin" /> Salvando...</> : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de agendamentos do dia */}
              {selectedAppointments.length === 0 && !showForm ? (
                <div className="px-5 py-10 text-center">
                  <CalendarIcon size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400">Nenhum agendamento</p>
                  <p className="text-xs text-gray-400 mt-0.5">Clique acima para agendar</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[420px] overflow-y-auto">
                  {selectedAppointments.map(a => {
                    const st = STATUS_COLORS[a.status] ?? STATUS_COLORS.scheduled
                    return (
                      <li key={a.id} className={`px-4 py-3 ${a.status === 'cancelled' ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          {/* Hora */}
                          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg px-2 py-1 text-center shrink-0">
                            <p className="text-sm font-bold text-blue-500">{fmt.time(a.date)}</p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {a.clientName}
                            </p>
                            {a.service && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Scissors size={10} /> {a.service}
                              </p>
                            )}
                            <p className="text-xs font-bold text-blue-500 mt-0.5">{fmt.currency(a.value)}</p>
                            {a.notes && (
                              <p className="text-[10px] text-gray-400 mt-0.5 italic truncate">{a.notes}</p>
                            )}

                            {/* Status badge */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        {a.status === 'scheduled' && (
                          <div className="flex gap-1.5 mt-2 ml-[52px]">
                            <button onClick={() => updateStatus(a.id, 'completed')}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                              <CheckCircle2 size={11} /> Realizado
                            </button>
                            <button onClick={() => updateStatus(a.id, 'cancelled')}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                              <X size={11} /> Cancelar
                            </button>
                            <button onClick={() => deleteAppointment(a.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={11} /> Remover
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : (
            <div className="px-5 py-16 text-center">
              <CalendarIcon size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Selecione um dia</p>
              <p className="text-xs text-gray-400 mt-1">Clique em uma data para ver os agendamentos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
