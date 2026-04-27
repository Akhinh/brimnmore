import React, { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import type { Sale } from '../../types'
import { format } from 'date-fns'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const ActivityPage = () => {
  const { profile } = useAuth()
  const [sales, setSales] = useState<(Sale & { sale_items: { quantity_sold: number; subtotal: number; products: { name: string } }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [todayTotal, setTodayTotal] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('sales').select('*, sale_items(quantity_sold, subtotal, products(name))')
        .eq('worker_id', profile.id).order('created_at', { ascending: false }).limit(30)
      const allSales = data as typeof sales || []
      setSales(allSales)
      const todaySales = allSales.filter(s => s.created_at.startsWith(today))
      setTodayTotal(todaySales.reduce((sum, s) => sum + s.total_amount, 0))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-brand-black text-xl">My Activity</h1>
        <p className="text-brand-gray text-sm mt-0.5">Your recent transactions</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
          <p className="text-brand-gray text-xs font-display uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="font-display font-black text-brand-red text-xl">{fmt(todayTotal)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
          <p className="text-brand-gray text-xs font-display uppercase tracking-wider mb-1">Total Transactions</p>
          <p className="font-display font-black text-brand-black text-xl">{sales.length}</p>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size={24} /></div>
        : sales.length === 0 ? <EmptyState icon={<Activity size={24} className="text-brand-gray" />} title="No sales yet" subtitle="Your transactions will appear here" />
        : (
          <div className="space-y-2">
            {sales.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-brand-gray text-xs">{format(new Date(s.created_at), 'MMM d, h:mm a')}</p>
                  <p className="font-display font-bold text-brand-black">{fmt(s.total_amount)}</p>
                </div>
                <div className="space-y-1">
                  {s.sale_items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-brand-gray">{item.products?.name} × {item.quantity_sold}</span>
                      <span className="text-brand-black font-medium">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
