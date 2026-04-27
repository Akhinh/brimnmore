import React, { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, User, Bell, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

type Theme = 'dark' | 'light' | 'system'

export const SettingsPage = () => {
  const { profile } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('bnm-theme') as Theme) || 'dark')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    localStorage.setItem('bnm-theme', theme)
    const root = document.documentElement
    if (theme === 'light') root.classList.remove('dark')
    else root.classList.add('dark')
  }, [theme])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('user_id', profile?.user_id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Profile updated!')
    setSaving(false)
  }

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-white text-2xl">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5 font-body">Manage your store preferences</p>
      </div>

      {/* Appearance */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={15} className="text-white/40" />
          <h2 className="font-display font-semibold text-white text-sm">Appearance</h2>
        </div>
        <p className="text-white/40 text-xs mb-4 font-body">Choose how the admin portal looks</p>
        <div className="flex gap-2">
          {themes.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)}
              className={[
                'flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all text-xs font-display font-semibold',
                theme === t.value
                  ? 'bg-brand-red border-brand-red text-white'
                  : 'border-white/10 text-white/40 hover:text-white hover:border-white/20',
              ].join(' ')}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-white/40" />
          <h2 className="font-display font-semibold text-white text-sm">Profile</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <Input dark label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
          <Input dark label="Email" value={profile?.email || ''} disabled
            helper="Email cannot be changed here" />
          <Input dark label="Role" value="Administrator" disabled />
          <Button type="submit" loading={saving} size="sm">Save Changes</Button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={15} className="text-white/40" />
          <h2 className="font-display font-semibold text-white text-sm">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'New customer orders', sub: 'Get notified when a customer places an order' },
            { label: 'Low stock alerts', sub: 'Get notified when products run low' },
            { label: 'Browser notifications', sub: 'Show desktop notifications even when tab is in background' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm font-body">{item.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.sub}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-red" />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} className="text-white/40" />
          <h2 className="font-display font-semibold text-white text-sm">Security</h2>
        </div>
        <Button variant="ghost" size="sm"
          onClick={() => window.location.href = '/forgot-password'}
          className="text-white/40 hover:text-white hover:bg-white/8">
          Change Password
        </Button>
      </div>
    </div>
  )
}