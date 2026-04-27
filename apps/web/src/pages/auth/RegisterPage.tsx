import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [invitation, setInvitation] = useState<{ email: string; role: string } | null>(null)
  const [checkingToken, setCheckingToken] = useState(true)
  const [form, setForm] = useState({ full_name: '', password: '', confirm_password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    supabase.from('worker_invitations').select('email, role').eq('token', token)
      .eq('is_used', false).gt('expires_at', new Date().toISOString()).single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Invalid or expired invite link.'); navigate('/login') }
        else setInvitation(data)
        setCheckingToken(false)
      })
  }, [token])

  if (checkingToken) return <PageLoader />

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Full name is required'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      // Step 1 — Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: invitation!.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            role: invitation!.role,
          }
        }
      })
      if (error) throw error
      if (!data.user) throw new Error('User creation failed')

      // Step 2 — Manually create profile (don't rely on trigger)
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: data.user.id,
        full_name: form.full_name.trim(),
        email: invitation!.email,
        role: invitation!.role,
      }, { onConflict: 'user_id' })

      if (profileError) throw profileError

      // Step 3 — Mark invitation as used
      await supabase
        .from('worker_invitations')
        .update({ is_used: true })
        .eq('token', token!)

      toast.success('Account created! You can now log in.')
      navigate('/login')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-red/8 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <div className="inline-flex w-14 h-14 bg-brand-red rounded-2xl items-center justify-center mb-4 shadow-brand">
            <span className="font-display font-black text-white text-2xl">B</span>
          </div>
          <h1 className="font-display font-bold text-white text-xl">Create your account</h1>
          <p className="text-white/40 text-sm mt-1">You've been invited to join BnM as a <span className="text-brand-red capitalize">{invitation?.role}</span></p>
        </div>

        <div className="bg-brand-black-soft rounded-3xl border border-white/8 p-8">
          <div className="mb-5 px-3 py-2.5 bg-brand-red/10 rounded-xl border border-brand-red/20">
            <p className="text-xs text-brand-red font-semibold font-display uppercase tracking-wider mb-0.5">Registering as</p>
            <p className="text-white text-sm font-body">{invitation?.email}</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input dark label="Full Name" placeholder="Your full name" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              icon={<User size={15} />} />
            <Input dark label="Email" type="email" value={invitation?.email || ''} disabled icon={<Mail size={15} />} />
            <Input dark label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              icon={<Lock size={15} />}
              iconRight={<button type="button" onClick={() => setShowPass(!showPass)}><EyeOff size={14} /></button>} />
            <Input dark label="Confirm Password" type="password" placeholder="Repeat password"
              value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
              icon={<Lock size={15} />} />
            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">Create Account</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
