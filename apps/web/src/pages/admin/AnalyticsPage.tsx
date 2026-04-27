import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { DailyRevenue, ProductPerformance } from '../../types'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`
type Period = '7d' | '30d' | '3m' | '1y'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-black-soft border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-white/40 mb-2">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {fmt(p.value)}</p>)}
    </div>
  )
}

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState<DailyRevenue[]>([])
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([])
  const [totals, setTotals] = useState({ revenue: 0, profit: 0, cost: 0, sales: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const from = period === '7d' ? subDays(new Date(), 7)
        : period === '30d' ? subDays(new Date(), 30)
        : period === '3m' ? subMonths(new Date(), 3)
        : subMonths(new Date(), 12)
      const [revRes, prodRes] = await Promise.all([
        supabase.from('daily_revenue').select('*').gte('date', from.toISOString()).order('date'),
        supabase.from('product_performance').select('*').limit(10),
      ])
      const rev = (revRes.data || []).map(r => ({ ...r, revenue: Number(r.revenue), profit: Number(r.profit), cost: Number(r.cost), total_sales: Number(r.total_sales) }))
      setRevenue(rev)
      setTopProducts(prodRes.data as ProductPerformance[] || [])
      setTotals({
        revenue: rev.reduce((s, r) => s + r.revenue, 0),
        profit: rev.reduce((s, r) => s + r.profit, 0),
        cost: rev.reduce((s, r) => s + r.cost, 0),
        sales: rev.reduce((s, r) => s + r.total_sales, 0),
      })
      setLoading(false)
    }
    load()
  }, [period])

  const COLORS = ['#E8191A', '#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#EC4899']
  const pieData = topProducts.slice(0, 5).map(p => ({ name: p.name, value: p.total_sold }))
  const periods: Period[] = ['7d', '30d', '3m', '1y']

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">Business performance overview</p>
        </div>
        <div className="flex gap-1 bg-white/4 rounded-xl p-1">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${period === p ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '3m' ? '3 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: fmt(totals.revenue), color: '#E8191A' },
          { label: 'Net Profit', value: fmt(totals.profit), color: '#10B981' },
          { label: 'Total Cost', value: fmt(totals.cost), color: '#F97316' },
          { label: 'Transactions', value: String(totals.sales), color: '#3B82F6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-brand-black-soft rounded-2xl border border-white/8 p-4">
            <p className="text-white/40 text-xs font-display uppercase tracking-wider mb-2">{label}</p>
            <p className="font-display font-bold text-xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue line chart */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-white text-sm">Revenue vs Profit</h2>
          <Badge label={period} color="#E8191A" />
        </div>
        {revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenue} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" tick={{ fill: '#ffffff25', fontSize: 10 }} tickFormatter={v => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fill: '#ffffff25', fontSize: 10 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#E8191A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-white/20 text-sm text-center py-12">No sales data for this period</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products bar chart */}
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
          <h2 className="font-display font-bold text-white text-sm mb-4">Top Selling Products</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#ffffff25', fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_sold" name="Units Sold" fill="#E8191A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-white/20 text-sm text-center py-12">No product data</p>}
        </div>

        {/* Sales by type pie */}
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
          <h2 className="font-display font-bold text-white text-sm mb-4">Sales Distribution</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-white/60 text-xs truncate flex-1">{d.name}</p>
                    <p className="text-white text-xs font-display font-semibold">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-white/20 text-sm text-center py-12">No distribution data</p>}
        </div>
      </div>
    </div>
  )
}
