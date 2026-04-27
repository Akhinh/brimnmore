import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import type { Profile, Sale } from '../../types'
import { format } from 'date-fns'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const WorkerActivityPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [worker, setWorker] = useState<Profile | null>(null)
  const [sales, setSales] = useState<(Sale & { sale_items: { quantity_sold: number; subtotal: number; products: { name: string } }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, count: 0 })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      const [wRes, sRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('sales').select('*, sale_items(quantity_sold, subtotal, products(name))')
          .eq('worker_id', id).order('created_at', { ascending: false }).limit(50),
      ])
      setWorker(wRes.data as Profile)
      const allSales = sRes.data as typeof sales || []
      setSales(allSales)
      setStats({
        total: allSales.reduce((s, sale) => s + sale.total_amount, 0),
        count: allSales.length,
      })
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/workers')}
          icon={<ArrowLeft size={14} />}
          className="text-white/40 hover:text-white hover:bg-white/8">
          Back
        </Button>
        <div>
          <h1 className="font-display font-bold text-white text-2xl">
            {worker?.full_name || 'Worker'} Activity
          </h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">{worker?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-4">
          <p className="text-white/40 text-xs font-display uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="font-display font-black text-brand-red text-xl">{fmt(stats.total)}</p>
        </div>
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-4">
          <p className="text-white/40 text-xs font-display uppercase tracking-wider mb-1">Total Sales</p>
          <p className="font-display font-black text-white text-xl">{stats.count}</p>
        </div>
      </div>

      {/* Sales list */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>
      ) : sales.length === 0 ? (
        <EmptyState dark icon={<Activity size={24} className="text-white/30" />}
          title="No sales yet" subtitle="This worker hasn't recorded any sales" />
      ) : (
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-brand-black-soft rounded-2xl border border-white/8 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-xs font-body">
                  {format(new Date(s.created_at), 'MMM d, yyyy · h:mm a')}
                </p>
                <p className="font-display font-bold text-white">{fmt(s.total_amount)}</p>
              </div>
              <div className="space-y-1">
                {s.sale_items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white/40">{item.products?.name} × {item.quantity_sold}</span>
                    <span className="text-white/60 font-medium">{fmt(item.subtotal)}</span>
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