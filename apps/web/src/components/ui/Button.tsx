import React from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-red text-white hover:bg-brand-red-dark active:scale-[0.98] shadow-brand hover:shadow-lg',
  secondary: 'bg-brand-black text-white hover:bg-brand-black-soft active:scale-[0.98]',
  ghost: 'bg-transparent text-brand-black hover:bg-brand-gray-light active:scale-[0.98]',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 active:scale-[0.98]',
  outline: 'bg-transparent border border-brand-gray-light text-brand-black hover:bg-brand-gray-light active:scale-[0.98]',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, fullWidth, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-display font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none',
        variants[variant], sizes[size],
        fullWidth ? 'w-full' : '',
        (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
)
Button.displayName = 'Button'
