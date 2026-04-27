import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean; onClose: () => void; title?: string; subtitle?: string;
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; dark?: boolean
}
const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export const Modal = ({ open, onClose, title, subtitle, children, size = 'md', dark }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={[
        'relative w-full rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up',
        'max-h-[95vh] overflow-y-auto',
        sizes[size],
        dark ? 'bg-brand-black-soft text-white border border-white/10' : 'bg-white',
      ].join(' ')}>
        <div className={`flex items-start justify-between p-5 md:p-6 border-b ${dark ? 'border-white/10' : 'border-brand-gray-light'}`}>
          <div>
            {title && <h2 className={`font-display font-bold text-lg ${dark ? 'text-white' : 'text-brand-black'}`}>{title}</h2>}
            {subtitle && <p className={`text-sm mt-0.5 ${dark ? 'text-white/50' : 'text-brand-gray'}`}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${dark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-brand-gray-light text-brand-gray'}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>
  )
}
