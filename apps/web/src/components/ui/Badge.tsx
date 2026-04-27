import React from 'react'
import type { OrderStatus } from '../../types'

interface BadgeProps { label: string; color?: string; dot?: boolean; className?: string }
export const Badge = ({ label, color = '#E8191A', dot, className = '' }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-display ${className}`}
    style={{ background: `${color}18`, color }}>
    {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
    {label}
  </span>
)

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F97316' },
  confirmed: { label: 'Confirmed', color: '#3B82F6' },
  fulfilled: { label: 'Fulfilled', color: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
}
export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const cfg = statusConfig[status]
  return <Badge label={cfg.label} color={cfg.color} dot />
}

interface StockBadgeProps { quantity: number; threshold: number }
export const StockBadge = ({ quantity, threshold }: StockBadgeProps) => {
  if (quantity === 0) return <Badge label="Out of Stock" color="#EF4444" dot />
  if (quantity <= threshold) return <Badge label="Low Stock" color="#F97316" dot className="status-pending" />
  return <Badge label="In Stock" color="#10B981" dot />
}
