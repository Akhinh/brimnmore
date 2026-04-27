import React, { useState, useEffect, useCallback } from 'react'
import { Bell, ShoppingCart, AlertTriangle, RefreshCcw, CheckCheck, Trash2, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'
import type { Notification } from '../../types'
import { format, formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const typeConfig = {
  new_order: {
    icon: ShoppingCart,
    color: '#E8191A',
    label: 'New Order',
    route: '/admin/orders',
  },
  low_stock: {
    icon: AlertTriangle,
    color: '#F97316',
    label: 'Low Stock',
    route: '/admin/inventory',
  },
  restock_request: {
    icon: RefreshCcw,
    color: '#3B82F6',
    label: 'Restock Request',
    route: '/admin/restock',
  },
}

export const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setNotifications(data as Notification[] || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    // Realtime: push new notifications into the list live
    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  // Mark all as read when this page mounts
  useEffect(() => {
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .then(() => {})
  }, [])

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('All notifications marked as read')
    setMarkingAll(false)
  }

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = async () => {
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setNotifications([])
    toast.success('All notifications cleared')
  }

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markOneRead(n.id)
    const route = typeConfig[n.type]?.route
    if (route) navigate(route)
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Notifications</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost"
              onClick={markAllRead} loading={markingAll}
              icon={<CheckCheck size={14} />}
              className="text-white/50 hover:text-white hover:bg-white/8">
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="ghost"
              onClick={clearAll}
              icon={<Trash2 size={14} />}
              className="text-white/30 hover:text-red-400 hover:bg-red-400/8">
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-display font-semibold capitalize transition-all ${filter === f ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white'}`}>
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[9px]">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState dark
          icon={<Bell size={24} className="text-white/20" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          subtitle={filter === 'unread' ? 'Switch to All to see past notifications' : 'New orders and alerts will appear here instantly'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg = typeConfig[n.type] || { icon: Bell, color: '#6B7280', label: n.type, route: null }
            const Icon = cfg.icon

            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={[
                  'group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer',
                  n.is_read
                    ? 'bg-brand-black-soft/40 border-white/5 hover:border-white/10'
                    : 'bg-brand-black-soft border-white/12 hover:border-white/20',
                ].join(' ')}
              >
                {/* Unread dot */}
                {!n.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-brand-red rounded-full animate-pulse-red" />
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}18` }}
                >
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge label={cfg.label} color={cfg.color} />
                    <span className="text-white/25 text-xs font-body">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm font-body font-medium ${n.is_read ? 'text-white/50' : 'text-white'}`}>
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-white/30 text-xs mt-0.5 font-body">{n.message}</p>
                  )}
                  <p className="text-white/15 text-[10px] mt-1.5 font-body">
                    {format(new Date(n.created_at), 'MMMM d, yyyy · h:mm a')}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-400/10 text-white/20 hover:text-red-400 transition-all shrink-0 mt-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Realtime status indicator */}
      <div className="flex items-center gap-2 pt-2">
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        <p className="text-white/20 text-xs font-body">Live — notifications appear instantly</p>
      </div>
    </div>
  )
}
