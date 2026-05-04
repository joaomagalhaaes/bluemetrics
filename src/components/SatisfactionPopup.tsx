'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown, X, Sparkles } from 'lucide-react'

const POPUP_DELAY_MS = 5 * 60 * 1000 // 5 minutos
const STORAGE_KEY = 'bm_satisfaction_shown'

export default function SatisfactionPopup() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'question' | 'positive' | 'negative'>('question')

  useEffect(() => {
    // Só mostrar uma vez
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => {
      // Checar de novo (pode ter sido setado em outra aba)
      if (localStorage.getItem(STORAGE_KEY)) return
      setShow(true)
    }, POPUP_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  function handlePositive() {
    setStep('positive')
    localStorage.setItem(STORAGE_KEY, 'yes')
    setTimeout(() => {
      setShow(false)
      router.push('/billing?reason=no_subscription')
    }, 2000)
  }

  function handleNegative() {
    setStep('negative')
    localStorage.setItem(STORAGE_KEY, 'no')
    setTimeout(() => setShow(false), 3000)
  }

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-blue-100 dark:border-gray-700 p-6 max-w-sm w-full relative">
        <button onClick={handleClose} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400">
          <X size={18} />
        </button>

        {step === 'question' && (
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Está gostando do BlueMetrics?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Seu feedback nos ajuda a melhorar cada vez mais!
            </p>
            <div className="flex gap-3">
              <button onClick={handlePositive}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm">
                <ThumbsUp size={18} /> Sim, estou!
              </button>
              <button onClick={handleNegative}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm">
                <ThumbsDown size={18} /> Ainda não
              </button>
            </div>
          </div>
        )}

        {step === 'positive' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ThumbsUp size={28} className="text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Que bom! 🎉
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vamos te mostrar como continuar usando com 7 dias grátis...
            </p>
          </div>
        )}

        {step === 'negative' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ThumbsDown size={28} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Obrigado pelo feedback!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vamos trabalhar para melhorar sua experiência. Continue explorando!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
