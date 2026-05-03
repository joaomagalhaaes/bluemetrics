'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, BarChart2 } from 'lucide-react'

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, cpf: cpf.replace(/\D/g, ''), phone: phone.replace(/\D/g, ''), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta')
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{
        background: '#07101f',
        backgroundImage: `
          radial-gradient(ellipse 70% 60% at 15% 10%, rgba(37,99,235,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 85% 90%, rgba(79,70,229,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)
        `,
      }}
    >
      {/* Grid sutil */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-[380px] relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-[68px] h-[68px] rounded-[18px] flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #3b82f6 0%, #1d4ed8 60%, #1e3a8a 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.5), 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[42%] rounded-t-[17px]"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.0) 100%)' }}
            />
            <BarChart2 size={30} className="text-white relative z-10" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#e8f0ff', textShadow: '0 1px 8px rgba(59,130,246,0.4)' }}>
            BlueMetrics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(148,186,255,0.7)' }}>
            7 dias grátis — sem cartão agora
          </p>
        </div>

        {/* Card de vidro */}
        <div
          className="rounded-[22px] p-6"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
        >
          <h2 className="text-[17px] font-semibold mb-0.5" style={{ color: 'rgba(235,245,255,0.95)' }}>
            Criar sua conta
          </h2>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(148,186,255,0.55)' }}>
            Leva menos de 1 minuto
          </p>

          {error && (
            <div
              className="mb-4 px-3.5 py-2.5 rounded-xl text-[13px]"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <GlassInput label="Nome completo" value={name} onChange={e => setName(e.target.value)}
              placeholder="Como você se chama?" required />

            <GlassInput label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required />

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="CPF (opcional)"
                inputMode="numeric"
                value={cpf}
                onChange={e => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
              />
              <GlassInput
                label="Telefone (opcional)"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                  const f = v.length > 6
                    ? `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
                    : v.length > 2 ? `(${v.slice(0,2)}) ${v.slice(2)}` : v
                  setPhone(f)
                }}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(180,210,255,0.7)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(235,245,255,0.92)', caretColor: '#60a5fa' }}
                  onFocus={e => { e.target.style.border = '1px solid rgba(96,165,250,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(148,186,255,0.45)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <GlossyButton loading={loading} label="Criar conta grátis" />
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-center text-[13px]" style={{ color: 'rgba(148,186,255,0.5)' }}>
              Já tem conta?{' '}
              <Link href="/" className="font-semibold hover:underline" style={{ color: '#60a5fa' }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: 'rgba(100,130,180,0.4)' }}>
          © 2026 BlueMetrics · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}

function GlassInput({
  label, type = 'text', inputMode, value, onChange, placeholder, required,
}: {
  label: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(180,210,255,0.7)' }}>
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(235,245,255,0.92)', caretColor: '#60a5fa' }}
        onFocus={e => { e.target.style.border = '1px solid rgba(96,165,250,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
        onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function GlossyButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden transition-opacity disabled:opacity-60 mt-1"
      style={{
        background: 'linear-gradient(180deg, #4f8ef7 0%, #2563eb 48%, #1d4ed8 49%, #1e40af 100%)',
        boxShadow: '0 2px 12px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      <span className="pointer-events-none absolute top-0 left-0 right-0 h-[50%] rounded-t-xl"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.0) 100%)' }} />
      <span className="relative z-10">{loading ? 'Criando conta...' : label}</span>
    </button>
  )
}
