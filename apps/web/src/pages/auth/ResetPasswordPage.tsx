import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters'); return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match'); return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated successfully!')
    setTimeout(() => navigate('/login'), 1500)
    setLoading(false)
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
          <h1 className="font-display font-bold text-white text-xl">Set new password</h1>
          <p className="text-white/40 text-sm mt-1 font-body">Choose a strong password</p>
        </div>

        <div className="bg-brand-black-soft rounded-3xl border border-white/8 p-8">
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              dark
              label="New Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={15} />}
              iconRight={
                <button type="button" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              autoFocus
            />
            <Input
              dark
              label="Confirm Password"
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              icon={<Lock size={15} />}
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              icon={<Check size={15} />}
              className="mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}