import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  dark?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, iconRight, dark, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const base = dark
      ? 'bg-brand-black-muted border-white/10 text-white placeholder:text-white/30 focus:border-brand-red'
      : 'bg-white border-brand-gray-light text-brand-black placeholder:text-brand-gray focus:border-brand-red'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-xs font-semibold font-display uppercase tracking-wider ${dark ? 'text-white/60' : 'text-brand-gray'}`}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <span className={`absolute left-3 ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-11 rounded-xl border transition-all duration-200 font-body text-sm',
              'focus:outline-none focus:ring-2 focus:ring-brand-red/20',
              icon ? 'pl-10' : 'pl-4',
              iconRight ? 'pr-10' : 'pr-4',
              error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : base,
              className,
            ].join(' ')}
            {...props}
          />
          {iconRight && <span className={`absolute right-3 ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{iconRight}</span>}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
        {helper && !error && <p className={`text-xs ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  dark?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, dark, options, placeholder, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const base = dark
      ? 'bg-brand-black-muted border-white/10 text-white focus:border-brand-red'
      : 'bg-white border-brand-gray-light text-brand-black focus:border-brand-red'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-xs font-semibold font-display uppercase tracking-wider ${dark ? 'text-white/60' : 'text-brand-gray'}`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            'w-full h-11 rounded-xl border transition-all duration-200 font-body text-sm px-4 cursor-pointer appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-red/20',
            error ? 'border-red-400' : base,
            className,
          ].join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
  dark?: boolean
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, dark, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const base = dark
      ? 'bg-brand-black-muted border-white/10 text-white placeholder:text-white/30 focus:border-brand-red'
      : 'bg-white border-brand-gray-light text-brand-black placeholder:text-brand-gray focus:border-brand-red'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-xs font-semibold font-display uppercase tracking-wider ${dark ? 'text-white/60' : 'text-brand-gray'}`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-xl border transition-all duration-200 font-body text-sm px-4 py-3 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-red/20',
            error ? 'border-red-400' : base,
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
        {helper && !error && <p className={`text-xs ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{helper}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
