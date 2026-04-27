import React from 'react'

interface EmptyStateProps { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; dark?: boolean }
export const EmptyState = ({ icon, title, subtitle, action, dark }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    {icon && <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-white/5' : 'bg-brand-gray-light'}`}>{icon}</div>}
    <h3 className={`font-display font-semibold text-base mb-1 ${dark ? 'text-white/70' : 'text-brand-black'}`}>{title}</h3>
    {subtitle && <p className={`text-sm max-w-xs ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{subtitle}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)
