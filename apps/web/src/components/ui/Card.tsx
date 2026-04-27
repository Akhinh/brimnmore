import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  dark?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}
const paddings = { none: '', sm: 'p-4', md: 'p-5 md:p-6', lg: 'p-6 md:p-8' }
export const Card = ({ dark, hover, padding = 'md', children, className = '', ...props }: CardProps) => (
  <div className={[
    'rounded-2xl border transition-all duration-200',
    dark ? 'bg-brand-black-soft border-white/8 text-white' : 'bg-white border-brand-gray-light shadow-card',
    hover ? (dark ? 'hover:border-white/15 hover:shadow-lg cursor-pointer' : 'hover:shadow-card-hover cursor-pointer') : '',
    paddings[padding],
    className,
  ].join(' ')} {...props}>
    {children}
  </div>
)

interface StatCardProps {
  title: string; value: string | number; subtitle?: string; icon: React.ReactNode;
  trend?: { value: number; positive: boolean }; dark?: boolean; color?: string
}
export const StatCard = ({ title, value, subtitle, icon, trend, dark, color = '#E8191A' }: StatCardProps) => (
  <Card dark={dark} className="animate-slide-up">
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
    <p className={`text-xs font-semibold font-display uppercase tracking-wider mb-1 ${dark ? 'text-white/50' : 'text-brand-gray'}`}>{title}</p>
    <p className={`text-2xl font-display font-bold ${dark ? 'text-white' : 'text-brand-black'}`}>{value}</p>
    {subtitle && <p className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-brand-gray'}`}>{subtitle}</p>}
  </Card>
)
