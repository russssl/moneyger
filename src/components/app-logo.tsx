'use client'
import { useSidebar } from './ui/sidebar'
export default function AppLogo() {
  const { state } = useSidebar()
  return (
    <div className="flex items-center justify-center">
      <div className="text-2xl font-bold text-blue-600 tracking-wide">
        {state === 'collapsed' ? 'MG' : 'Moneyger'}
      </div>
    </div>
  )
}