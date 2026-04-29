import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('bnm-pwa-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = ('standalone' in navigator) && (navigator as Navigator & { standalone?: boolean }).standalone

    if (isIOS && !isStandalone) {
      setTimeout(() => setShowIOS(true), 3000)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShowBanner(false)
    setShowIOS(false)
    localStorage.setItem('bnm-pwa-dismissed', 'true')
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem('bnm-pwa-dismissed', 'true')
    setShowBanner(false)
    setDeferredPrompt(null)
  }

  if (showBanner && deferredPrompt) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-brand-black-soft border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center shrink-0">
            <span className="font-display font-black text-white text-base">B</span>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">Install Brill 'n' More</p>
            <p className="text-white/40 text-xs mt-0.5">Add to home screen for quick access</p>
          </div>
          <button onClick={dismiss} className="text-white/30 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={dismiss} className="flex-1 text-white/40 hover:text-white hover:bg-white/8">Not now</Button>
          <Button size="sm" onClick={install} icon={<Download size={13} />} className="flex-1">Install App</Button>
        </div>
      </div>
    </div>
  )

  if (showIOS) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-brand-black-soft border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-brand-red" />
            <p className="font-display font-bold text-white text-sm">Install on iPhone</p>
          </div>
          <button onClick={dismiss} className="text-white/30 hover:text-white p-1"><X size={16} /></button>
        </div>
        {[
          'Tap the Share button at the bottom of Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5 mb-2">
            <div className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{i + 1}</span>
            </div>
            <p className="text-white/60 text-xs font-body">{text}</p>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={dismiss} fullWidth className="mt-2 text-white/40 hover:text-white hover:bg-white/8">Got it</Button>
      </div>
    </div>
  )

  return null
}