import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'At least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error(error.message); setLoading(false); return }
      if (data.session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.session.user.id).single()
        if (profile?.role === 'admin') navigate('/admin')
        else navigate('/worker')
      }
    } catch { toast.error('Something went wrong. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-red/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-red/5 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, white, white 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, white, white 1px, transparent 1px, transparent 40px)' }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Brand mark */}
        <div className="mb-10 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-red rounded-2xl shadow-brand mb-5 relative">
            <span className="font-display font-black text-white text-3xl">B</span>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="font-display font-black text-brand-red text-[8px]">n</span>
            </div>
          </div>
          <h1 className="font-display font-black text-white text-2xl tracking-tight">Brill 'n' More</h1>
          <p className="text-white/40 text-sm font-body mt-1">Wholesale Management System</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-brand-black-soft rounded-3xl border border-white/8 p-8">
            <h2 className="font-display font-bold text-white text-xl mb-1">Welcome back</h2>
            <p className="text-white/40 text-sm font-body mb-7">Sign in to your portal</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                dark label="Email Address" type="email" placeholder="you@bnm.com"
                value={email} onChange={e => setEmail(e.target.value)}
                error={errors.email} icon={<Mail size={15} />}
                autoComplete="email" autoFocus
              />
              <Input
                dark label="Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                error={errors.password} icon={<Lock size={15} />}
                iconRight={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-white/40 hover:text-brand-red transition-colors font-body"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading} className="mt-6">
                Sign In
              </Button>
              <p className="text-center text-white/20 text-xs mt-4 font-body">
                Admin & Worker Portal — use your invite credentials
              </p>
            </form>
          </div>

          {/* Register via invite */}
          <p className="text-center text-white/30 text-xs mt-6 font-body">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-red hover:text-brand-red-light transition-colors">
              Use your invite link
            </Link>
          </p>
        </div>

        {/* Customer portal link */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/order"
            className="text-white/20 text-xs hover:text-white/40 transition-colors font-body underline underline-offset-4">
            Place an order as a customer →
          </Link>
        </div>
      </div>
    </div>
  )
}
