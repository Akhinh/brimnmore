import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, Bell, LogOut, Menu, X, ChevronRight, QrCode, RefreshCcw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/inventory', icon: Package, label: 'Inventory' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/workers', icon: Users, label: 'Workers' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/order-links', icon: QrCode, label: 'Order Links' },
  { to: '/admin/restock', icon: RefreshCcw, label: 'Restock' },
]

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  // Load initial unread count
  const loadUnread = useCallback(async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }, [])

  useEffect(() => {
    loadUnread()
  }, [loadUnread])

  // Realtime: listen for new customer orders AND new notifications
  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to new customer orders
    const ordersChannel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_orders' },
        (payload) => {
          const order = payload.new as { customer_name: string; total_amount: number }

          // In-app toast
          toast.custom(
            (t) => (
              <div
                className={`flex items-start gap-3 bg-brand-black-soft border border-white/10 rounded-2xl px-4 py-3 shadow-xl cursor-pointer max-w-sm ${t.visible ? 'animate-slide-up' : 'opacity-0'}`}
                onClick={() => { navigate('/admin/orders'); toast.dismiss(t.id) }}
              >
                <div className="w-9 h-9 bg-brand-red/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingCart size={16} className="text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-display font-semibold">New Order Received 🛒</p>
                  <p className="text-white/50 text-xs mt-0.5 truncate">
                    {order.customer_name} — ₦{Number(order.total_amount).toLocaleString('en-NG')}
                  </p>
                  <p className="text-brand-red text-xs mt-1 font-semibold">Click to view →</p>
                </div>
              </div>
            ),
            { duration: 8000, position: 'top-right' }
          )

          // Browser notification (works even if tab is in background)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New BnM Order 🛒', {
              body: `${order.customer_name} just placed an order`,
              icon: '/favicon.svg',
              tag: 'new-order',
            })
          }

          // Bump unread count
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    // Subscribe to new notifications (low stock, etc.)
    const notifsChannel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notif = payload.new as { type: string; title: string; message: string }

          // Only show non-order notifications here (orders handled above)
          if (notif.type !== 'new_order') {
            toast.custom(
              (t) => (
                <div
                  className={`flex items-start gap-3 bg-brand-black-soft border border-white/10 rounded-2xl px-4 py-3 shadow-xl cursor-pointer max-w-sm ${t.visible ? 'animate-slide-up' : 'opacity-0'}`}
                  onClick={() => { navigate('/admin/notifications'); toast.dismiss(t.id) }}
                >
                  <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-display font-semibold">{notif.title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ),
              { duration: 6000, position: 'top-right' }
            )
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(notifsChannel)
    }
  }, [navigate])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full bg-brand-black text-white ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center shadow-brand">
            <span className="font-display font-black text-white text-base">B</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">Brill 'n' More</p>
            <p className="text-white/40 text-[10px] font-body mt-0.5 uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 group',
              isActive ? 'bg-brand-red text-white shadow-brand' : 'text-white/50 hover:text-white hover:bg-white/6',
            ].join(' ')}>
            <Icon size={16} />
            {label}
            <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
        <NavLink to="/admin/settings"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${isActive ? 'bg-brand-red text-white' : 'text-white/50 hover:text-white hover:bg-white/6'}`}>
          <Settings size={16} /> Settings
        </NavLink>
        <div className="px-3 py-3 mt-2 rounded-xl bg-white/4 border border-white/8">
          <p className="text-white text-sm font-semibold font-body truncate">{profile?.full_name}</p>
          <p className="text-white/40 text-xs font-body truncate">{profile?.email}</p>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-white/40 hover:text-red-400 hover:bg-red-400/8 transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-brand-black-soft overflow-hidden dark">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full animate-slide-in-right">
            <Sidebar mobile />
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/8 bg-brand-black-soft">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8">
            <Menu size={20} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-2">
            <NavLink to="/admin/notifications"
              className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
              onClick={() => setUnreadCount(0)}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-red rounded-full flex items-center justify-center text-white text-[9px] font-display font-bold px-1 animate-pulse-red">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
            <div className="w-8 h-8 bg-brand-red rounded-xl flex items-center justify-center cursor-pointer">
              <span className="font-display font-bold text-white text-xs">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
