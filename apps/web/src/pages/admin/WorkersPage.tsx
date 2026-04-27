import React, { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, Mail, Copy, Check, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import type { Profile, WorkerInvitation } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export const WorkersPage = () => {
  const { profile: myProfile } = useAuth()
  const [workers, setWorkers] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<WorkerInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    const [wRes, iRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'worker').order('full_name'),
      supabase.from('worker_invitations').select('*').eq('is_used', false).order('created_at', { ascending: false }),
    ])
    setWorkers(wRes.data as Profile[] || [])
    setInvitations(iRes.data as WorkerInvitation[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) { toast.error('Enter a valid email'); return }
    setInviting(true)
    try {
      const { data, error } = await supabase.from('worker_invitations')
        .insert({ email: inviteEmail.trim(), role: 'worker', created_by: myProfile?.id })
        .select().single()
      if (error) throw error
      const link = `${window.location.origin}/register?token=${data.token}`
      setGeneratedLink(link)
      toast.success('Invitation created!')
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invitation')
    } finally { setInviting(false) }
  }

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/register?token=${token}`
    await navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Link copied!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const toggleWorker = async (w: Profile) => {
    await supabase.from('profiles').update({ is_active: !w.is_active }).eq('id', w.id)
    toast.success(w.is_active ? 'Worker deactivated' : 'Worker activated')
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={28} className="text-white/30" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Workers</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">{workers.length} worker{workers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => { setInviteEmail(''); setGeneratedLink(null); setShowInviteModal(true) }}
          icon={<UserPlus size={16} />} size="sm">Invite Worker</Button>
      </div>

      {/* Workers list */}
      {workers.length === 0 ? (
        <EmptyState dark icon={<Users size={24} className="text-white/30" />}
          title="No workers yet" subtitle="Invite your first worker using the button above"
          action={<Button onClick={() => setShowInviteModal(true)} size="sm" icon={<UserPlus size={14} />}>Invite Worker</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workers.map(w => (
            <div key={w.id} 
              className="bg-brand-black-soft rounded-2xl border border-white/8 p-4 flex items-center gap-4 cursor-pointer hover:border-white/20 transition-all"
              onClick={() => navigate(`/admin/workers/${w.id}/activity`)}>
              <div className="w-10 h-10 bg-brand-red/15 rounded-xl flex items-center justify-center shrink-0">
                <span className="font-display font-bold text-brand-red text-base">{w.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-white text-sm truncate">{w.full_name}</p>
                <p className="text-white/40 text-xs font-body truncate">{w.email}</p>
                <p className="text-white/20 text-xs mt-0.5">Joined {format(new Date(w.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge label={w.is_active ? 'Active' : 'Inactive'} color={w.is_active ? '#10B981' : '#6B7280'} dot />
                <button onClick={() => toggleWorker(w)} className="text-white/30 hover:text-white transition-colors">
                  {w.is_active ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-white/60 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={13} /> Pending Invitations
          </h2>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-brand-black-soft/60 rounded-xl border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail size={14} className="text-white/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-body truncate">{inv.email}</p>
                    <p className="text-white/30 text-xs">Expires {format(new Date(inv.expires_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <button onClick={() => copyLink(inv.token)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-brand-red transition-colors shrink-0">
                  {copiedToken === inv.token ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copiedToken === inv.token ? 'Copied' : 'Copy link'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal dark open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite a Worker" subtitle="Send a registration link to a new worker">
        {!generatedLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input dark label="Worker's Email Address" type="email" placeholder="worker@example.com"
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} icon={<Mail size={15} />} />
            <p className="text-white/30 text-xs">A unique registration link will be generated. The link expires in 7 days.</p>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="text-white/50 hover:text-white hover:bg-white/8 flex-1">Cancel</Button>
              <Button type="submit" loading={inviting} icon={<UserPlus size={15} />} className="flex-1">Generate Link</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 text-sm font-semibold mb-1">✓ Invitation created!</p>
              <p className="text-white/50 text-xs">Share this link with the worker. It expires in 7 days.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/8">
              <p className="text-white/40 text-[10px] font-display uppercase tracking-wider mb-1">Registration Link</p>
              <p className="text-white text-xs font-body break-all">{generatedLink}</p>
            </div>
            <Button fullWidth icon={<Copy size={15} />} onClick={async () => { await navigator.clipboard.writeText(generatedLink); toast.success('Copied!') }}>
              Copy Link
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setShowInviteModal(false)} className="text-white/40 hover:text-white hover:bg-white/8">Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
