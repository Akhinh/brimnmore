import React, { useEffect, useState } from 'react'
import { Package, TrendingUp, ShoppingCart, AlertTriangle, DollarSign, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StatCard } from '../../components/ui/Card'
import { Badge, StockBadge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import type { Product, DailyRevenue, CustomerOrder, Notification } from '../../types'
import { Link, useLocation } from 'react-router-dom'


const formatCurrency = (v: number) => `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-black-soft border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-white/50 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

export const DashboardPage = () => {
  const location = useLocation()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ revenue: 0, profit: 0, products: 0, lowStock: 0, pendingOrders: 0, todaySales: 0 })
  const [chartData, setChartData] = useState<DailyRevenue[]>([])
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    if (error) { setLoading(false); return }
    
    setStats({
      revenue: data.month_revenue,
      profit: data.month_profit,
      products: data.total_products,
      lowStock: data.low_stock_count,
      pendingOrders: data.pending_orders,
      todaySales: data.today_revenue,
    })
    setLowStockItems(data.low_stock_items || [])
    setRecentOrders(data.recent_orders || [])
    setLoading(false)
  }
  load()
},  [location.pathname])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={32} className="text-white/30" /></div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/40 text-sm font-body">{greeting},</p>
          <h1 className="font-display font-bold text-white text-2xl">{profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-white/30 text-xs mt-1 font-body">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-white/40 font-body">{notifications.length} unread</span>
            <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse-red" />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard dark title="30-Day Revenue" value={formatCurrency(stats.revenue)} icon={<DollarSign size={18} />}
          subtitle="Total income this month" color="#E8191A" />
        <StatCard dark title="30-Day Profit" value={formatCurrency(stats.profit)} icon={<TrendingUp size={18} />}
          subtitle="After buying costs" color="#10B981" />
        <StatCard dark title="Today's Sales" value={formatCurrency(stats.todaySales)} icon={<Activity size={18} />}
          subtitle="Revenue today" color="#3B82F6" />
        <StatCard dark title="Active Products" value={stats.products} icon={<Package size={18} />}
          subtitle="In inventory" color="#8B5CF6" />
        <StatCard dark title="Low Stock" value={stats.lowStock} icon={<AlertTriangle size={18} />}
          subtitle="Items need restocking" color="#F97316" />
        <StatCard dark title="Pending Orders" value={stats.pendingOrders} icon={<ShoppingCart size={18} />}
          subtitle="Customer orders waiting" color="#E8191A" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-white text-base">Revenue & Profit</h2>
            <p className="text-white/40 text-xs mt-0.5 font-body">Last 30 days</p>
          </div>
          <Badge label="30 Days" color="#E8191A" />
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8191A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E8191A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
              <XAxis dataKey="date" tick={{ fill: '#ffffff30', fontSize: 10 }} tickFormatter={v => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E8191A" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" fill="url(#profGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-white/20 text-sm">No sales data yet</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" /> Low Stock Alerts
            </h2>
            <Link to="/admin/inventory" className="text-xs text-brand-red hover:underline font-body">View all</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-6">All stock levels are healthy ✓</p>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-body font-medium truncate">{p.name}</p>
                    <p className="text-white/30 text-xs">{p.manufacturers?.name}</p>
                  </div>
                  <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <ShoppingCart size={14} className="text-brand-red" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-brand-red hover:underline font-body">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-6">No recent orders</p>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-body font-medium truncate">{o.customer_name}</p>
                    <p className="text-white/30 text-xs">{format(new Date(o.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-white text-sm font-semibold">{formatCurrency(o.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
