import React, { useState, useEffect, useCallback } from 'react'
import { QrCode, Plus, Copy, Check, ToggleRight, ToggleLeft, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import type { OrderLink } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export const OrderLinksPage = () => {
  const { profile } = useAuth()
  const [links, setLinks] = useState<OrderLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showQR, setShowQR] = useState<OrderLink | null>(null)
  const [label, setLabel] = useState('Customer Orders')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const getLink = (token: string) => `${window.location.origin}/order/${token}`

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('order_links').select('*').order('created_at', { ascending: false })
    setLinks(data as OrderLink[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) { toast.error('Label is required'); return }
    setCreating(true)
    const { error } = await supabase.from('order_links').insert({ label: label.trim(), created_by: profile?.id })
    if (error) { toast.error('Failed to create link'); setCreating(false); return }
    toast.success('Order link created!')
    setShowCreate(false); setLabel('Customer Orders'); load(); setCreating(false)
  }

  const toggleLink = async (link: OrderLink) => {
    await supabase.from('order_links').update({ is_active: !link.is_active }).eq('id', link.id)
    toast.success(link.is_active ? 'Link deactivated' : 'Link activated')
    load()
  }

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(getLink(token))
    setCopied(token); toast.success('Link copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-white/30" /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Order Links</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">Generate links & QR codes for customers</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<Plus size={16} />} size="sm">New Link</Button>
      </div>

      {links.length === 0 ? (
        <EmptyState dark icon={<QrCode size={24} className="text-white/30" />}
          title="No order links yet" subtitle="Create a link and share it or its QR code with customers"
          action={<Button onClick={() => setShowCreate(true)} size="sm" icon={<Plus size={14} />}>Create Link</Button>} />
      ) : (
        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display font-semibold text-white text-sm">{link.label}</h3>
                    <Badge label={link.is_active ? 'Active' : 'Inactive'} color={link.is_active ? '#10B981' : '#6B7280'} dot />
                  </div>
                  <p className="text-white/30 text-xs font-mono truncate">{getLink(link.token)}</p>
                  <p className="text-white/20 text-xs mt-1">Created {format(new Date(link.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => copyLink(link.token)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                    {copied === link.token ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                  <button onClick={() => setShowQR(link)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                    <QrCode size={15} />
                  </button>
                  <button onClick={() => window.open(getLink(link.token), '_blank')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                    <ExternalLink size={15} />
                  </button>
                  <button onClick={() => toggleLink(link)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                    {link.is_active ? <ToggleRight size={15} className="text-emerald-400" /> : <ToggleLeft size={15} className="text-white/30" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal dark open={showCreate} onClose={() => setShowCreate(false)} title="Create Order Link" subtitle="Customers can browse and place orders via this link">
        <form onSubmit={createLink} className="space-y-4">
          <Input dark label="Link Label" placeholder="e.g. Customer Orders — April" value={label} onChange={e => setLabel(e.target.value)} />
          <p className="text-white/30 text-xs">A unique link and QR code will be generated automatically.</p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 text-white/40 hover:text-white hover:bg-white/8">Cancel</Button>
            <Button type="submit" loading={creating} className="flex-1">Create Link</Button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      {showQR && (
        <Modal dark open={!!showQR} onClose={() => setShowQR(null)} title="QR Code" subtitle={showQR.label}>
          <div className="flex flex-col items-center gap-5">
            <div className="bg-white p-5 rounded-2xl">
              <QRCodeSVG value={getLink(showQR.token)} size={200} fgColor="#0A0A0A" />
            </div>
            <div className="w-full bg-white/4 rounded-xl p-3 border border-white/8">
              <p className="text-white/30 text-[10px] font-display uppercase tracking-wider mb-1">Customer Link</p>
              <p className="text-white text-xs font-body break-all">{getLink(showQR.token)}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button fullWidth variant="ghost" onClick={() => copyLink(showQR.token)} icon={<Copy size={14} />} className="text-white/40 hover:text-white hover:bg-white/8 flex-1">Copy Link</Button>
              <Button fullWidth onClick={() => setShowQR(null)} className="flex-1">Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
