'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    return (
      <div className="flex items-center bg-blue-50 dark:bg-gray-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'light'
              ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Sun size={13} /> Dia
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'dark'
              ? 'bg-gray-700 text-blue-400 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Moon size={13} /> Noite
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-blue-50 dark:bg-gray-800 rounded-xl p-1 gap-1 w-full">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
          theme === 'light'
            ? 'bg-white text-blue-500 shadow-sm'
            : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
        }`}
      >
        <Sun size={15} /> Dia
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-gray-700 text-blue-400 shadow-sm'
            : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
        }`}
      >
        <Moon size={15} /> Noite
      </button>
    </div>
  )
}
