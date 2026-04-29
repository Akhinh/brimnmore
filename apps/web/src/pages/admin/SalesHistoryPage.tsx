import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, TrendingUp, ChevronDown, DollarSign, Package, ShoppingBag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { format, subDays } from 'date-fns'

const fmt = (v: number) => `₦${Number(v).toLocaleString('en-NG')}`
type Period = 'all' | '7d' | '30d' | '3m' | '1y'

interface DayItem {
  product_name: string
  quantity_sold: number
  unit_price: number
  subtotal: number
  worker_name: string
  sale_time: string
}

interface DaySummary {
  date: string
  revenue: number
  cost: number
  profit: number
  total_sales: number
  items: DayItem[]
}

export const SalesHistoryPage = () => {
  const [days, setDays] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [totals, setTotals] = useState({ revenue: 0, profit: 0, cost: 0, sales: 0 })
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    const fromDate = period === '7d' ? subDays(new Date(), 7)
      : period === '30d' ? subDays(new Date(), 30)
      : period === '3m' ? subDays(new Date(), 90)
      : period === '1y' ? subDays(new Date(), 365)
      : new Date('2020-01-01')

    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        quantity_sold, unit_price, subtotal, created_at,
        products(name, buying_price),
        sales(created_at, profiles(full_name))
      `)
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })

    if (error || !data) { setLoading(false); return }

    const grouped: Record<string, DaySummary> = {}

    data.forEach((item: {
      quantity_sold: number; unit_price: number; subtotal: number; created_at: string
      products: { name: string; buying_price: number } | null
      sales: { profiles: { full_name: string } | null } | null
    }) => {
      const date = item.created_at.split('T')[0]
      const cost = item.quantity_sold * (item.products?.buying_price || 0)

      if (!grouped[date]) {
        grouped[date] = { date, revenue: 0, cost: 0, profit: 0, total_sales: 0, items: [] }
      }
      grouped[date].revenue += Number(item.subtotal)
      grouped[date].cost += cost
      grouped[date].profit += Number(item.subtotal) - cost
      grouped[date].total_sales += item.quantity_sold
      grouped[date].items.push({
        product_name: item.products?.name || 'Unknown',
        quantity_sold: item.quantity_sold,
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        worker_name: item.sales?.profiles?.full_name || 'Unknown',
        sale_time: format(new Date(item.created_at), 'h:mm a'),
      })
    })

    const sorted = Object.values(grouped).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    setDays(sorted)
    setTotals({
      revenue: sorted.reduce((s, d) => s + d.revenue, 0),
      profit: sorted.reduce((s, d) => s + d.profit, 0),
      cost: sorted.reduce((s, d) => s + d.cost, 0),
      sales: sorted.reduce((s, d) => s + d.total_sales, 0),
    })
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const toggleDay = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const periods: { value: Period; label: string }[] = [
    { value: '7d', label: '7 Days' }, { value: '30d', label: '30 Days' },
    { value: '3m', label: '3 Months' }, { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Sales History</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">Daily breakdown of all sales</p>
        </div>
        <div className="flex gap-1 bg-white/4 rounded-xl p-1 flex-wrap">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all whitespace-nowrap ${
                period === p.value ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: fmt(totals.revenue), color: 'text-white', icon: <DollarSign size={14} className="text-brand-red" /> },
          { label: totals.profit >= 0 ? 'Profit' : 'Loss', value: fmt(Math.abs(totals.profit)), color: totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <TrendingUp size={14} className={totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'} /> },
          { label: 'Cost', value: fmt(totals.cost), color: 'text-orange-400', icon: <ShoppingBag size={14} className="text-orange-400" /> },
          { label: 'Units Sold', value: String(totals.sales), color: 'text-white', icon: <Package size={14} className="text-blue-400" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-brand-black-soft rounded-2xl border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-2">{stat.icon}<p className="text-white/40 text-xs font-display uppercase tracking-wider">{stat.label}</p></div>
            <p className={`font-display font-black text-xl ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Days */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>
      ) : days.length === 0 ? (
        <EmptyState dark icon={<Calendar size={24} className="text-white/20" />}
          title="No sales history" subtitle="Sales will appear here once workers record transactions" />
      ) : (
        <div className="space-y-2">
          {days.map(day => {
            const isExpanded = expandedDates.has(day.date)
            const isProfit = day.profit >= 0
            const today = new Date().toISOString().split('T')[0]
            const yesterday = subDays(new Date(), 1).toISOString().split('T')[0]
            const dayLabel = day.date === today ? 'Today' : day.date === yesterday ? 'Yesterday' : format(new Date(day.date), 'EEEE')

            return (
              <div key={day.date} className="bg-brand-black-soft rounded-2xl border border-white/8 overflow-hidden">
                <button onClick={() => toggleDay(day.date)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/4 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/6 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-white/50 text-[9px] font-display uppercase">{format(new Date(day.date), 'MMM')}</span>
                      <span className="text-white font-display font-bold text-sm leading-none">{format(new Date(day.date), 'd')}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-display font-semibold text-sm">{dayLabel}</p>
                        <p className="text-white/30 text-xs">{format(new Date(day.date), 'MMM d, yyyy')}</p>
                      </div>
                      <p className="text-white/30 text-xs mt-0.5">{day.items.length} transaction{day.items.length !== 1 ? 's' : ''} · {day.total_sales} units sold</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-display font-semibold text-sm">{fmt(day.revenue)}</p>
                      <p className={`text-xs font-display font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : '-'}{fmt(Math.abs(day.profit))} {isProfit ? 'profit' : 'loss'}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/6 animate-slide-up">
                    <div className="grid grid-cols-3 border-b border-white/6">
                      {[
                        { label: 'Revenue', value: fmt(day.revenue), color: 'text-white' },
                        { label: 'Cost', value: fmt(day.cost), color: 'text-orange-400' },
                        { label: isProfit ? 'Profit' : 'Loss', value: fmt(Math.abs(day.profit)), color: isProfit ? 'text-emerald-400' : 'text-red-400' },
                      ].map(s => (
                        <div key={s.label} className="px-4 py-3 text-center border-r border-white/6 last:border-0">
                          <p className="text-white/30 text-[10px] font-display uppercase tracking-wider mb-0.5">{s.label}</p>
                          <p className={`font-display font-bold text-sm ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="divide-y divide-white/5">
                      {day.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 bg-brand-red/10 rounded-lg flex items-center justify-center shrink-0">
                              <Package size={12} className="text-brand-red" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-body font-medium truncate">{item.product_name}</p>
                              <p className="text-white/30 text-xs">{item.quantity_sold} × {fmt(item.unit_price)} · {item.worker_name} · {item.sale_time}</p>
                            </div>
                          </div>
                          <p className="font-display font-semibold text-white text-sm shrink-0 ml-3">{fmt(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}