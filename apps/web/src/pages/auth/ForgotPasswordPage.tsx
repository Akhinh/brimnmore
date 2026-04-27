import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your email'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-red/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8">
          <Link to="/login" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-body">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </div>

        <div className="bg-brand-black-soft rounded-3xl border border-white/8 p-8">
          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="font-display font-bold text-white text-xl mb-1">
                  Forgot password?
                </h1>
                <p className="text-white/40 text-sm font-body">
                  Enter your email and we'll send a reset link
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  dark
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<Mail size={15} />}
                  autoFocus
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-emerald-400" />
              </div>
              <h2 className="font-display font-bold text-white text-lg mb-2">
                Check your email
              </h2>
              <p className="text-white/40 text-sm font-body mb-6">
                A password reset link has been sent to{' '}
                <span className="text-white">{email}</span>
              </p>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => setSent(false)}
                className="text-white/40 hover:text-white hover:bg-white/8"
              >
                Send again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}