import React, { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Eye, Check, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import type { CustomerOrder, OrderStatus } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const OrdersPage = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<CustomerOrder | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('customer_orders').select('*, customer_order_items(*, products(name, unit, selling_price))').order('created_at', { ascending: false })
    if (filterStatus) q = q.eq('status', filterStatus)
    const { data } = await q
    setOrders(data as CustomerOrder[] || [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(true)
    await supabase.from('customer_orders').update({ status }).eq('id', id)
    toast.success(`Order marked as ${status}`)
    setSelected(prev => prev ? { ...prev, status } : null)
    load()
    setUpdating(false)
  }

  const statusColors: Record<OrderStatus, string> = { pending: 'text-orange-400', confirmed: 'text-blue-400', fulfilled: 'text-emerald-400', cancelled: 'text-white/30' }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Customer Orders</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">{orders.length} orders</p>
        </div>
        <Select dark value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          placeholder="All statuses" options={[{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'fulfilled', label: 'Fulfilled' }, { value: 'cancelled', label: 'Cancelled' }]}
          className="w-40" />
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>
        : orders.length === 0 ? <EmptyState dark icon={<ShoppingCart size={24} className="text-white/30" />} title="No orders yet" subtitle="Customer orders will appear here" />
        : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="bg-brand-black-soft rounded-2xl border border-white/8 px-4 py-3 flex items-center justify-between gap-4 hover:border-white/15 transition-all cursor-pointer" onClick={() => setSelected(o)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-brand-red text-sm">{o.customer_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-body font-medium truncate">{o.customer_name}</p>
                    <p className="text-white/30 text-xs">{o.customer_phone || 'No phone'} · {format(new Date(o.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-display font-semibold text-sm">{fmt(o.total_amount)}</p>
                    <p className="text-white/30 text-xs">{o.customer_order_items?.length || 0} item(s)</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <Eye size={14} className="text-white/20" />
                </div>
              </div>
            ))}
          </div>
        )}

      {selected && (
        <Modal dark open={!!selected} onClose={() => setSelected(null)} size="lg"
          title={`Order — ${selected.customer_name}`} subtitle={format(new Date(selected.created_at), 'MMMM d, yyyy · h:mm a')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/4 rounded-xl p-3 border border-white/8">
                <p className="text-white/40 text-xs mb-1">Customer</p>
                <p className="text-white text-sm font-medium">{selected.customer_name}</p>
              </div>
              <div className="bg-white/4 rounded-xl p-3 border border-white/8">
                <p className="text-white/40 text-xs mb-1">Phone</p>
                <p className="text-white text-sm font-medium">{selected.customer_phone || '—'}</p>
              </div>
            </div>
            {selected.customer_note && (
              <div className="bg-white/4 rounded-xl p-3 border border-white/8">
                <p className="text-white/40 text-xs mb-1">Customer Note</p>
                <p className="text-white text-sm">{selected.customer_note}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs font-display uppercase tracking-wider mb-2">Items Ordered</p>
              <div className="space-y-2">
                {selected.customer_order_items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm">{item.products?.name}</p>
                      <p className="text-white/30 text-xs">{item.quantity} × {fmt(item.unit_price)}</p>
                    </div>
                    <p className="text-white font-display font-semibold text-sm">{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm">Total</p>
                <p className="text-white font-display font-bold">{fmt(selected.total_amount)}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {selected.status === 'pending' && <>
                <Button variant="danger" icon={<X size={14} />} onClick={() => updateStatus(selected.id, 'cancelled')} loading={updating} className="flex-1">Cancel</Button>
                <Button icon={<Check size={14} />} onClick={() => updateStatus(selected.id, 'confirmed')} loading={updating} className="flex-1">Confirm</Button>
              </>}
              {selected.status === 'confirmed' && (
                <Button icon={<Check size={14} />} onClick={() => updateStatus(selected.id, 'fulfilled')} loading={updating} fullWidth>Mark Fulfilled</Button>
              )}
              {(selected.status === 'fulfilled' || selected.status === 'cancelled') && (
                <p className="text-white/30 text-sm w-full text-center py-2">This order is {selected.status}.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
