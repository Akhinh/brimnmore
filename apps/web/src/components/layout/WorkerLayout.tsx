import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Search, Activity, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/worker', icon: Package, label: 'Stock', end: true },
  { to: '/worker/sell', icon: ShoppingBag, label: 'Record Sale' },
  { to: '/worker/search', icon: Search, label: 'Search' },
  { to: '/worker/activity', icon: Activity, label: 'My Activity' },
]

export const WorkerLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="flex flex-col min-h-screen bg-brand-off-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-brand-gray-light shadow-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">B</span>
            </div>
            <div>
              <p className="font-display font-bold text-brand-black text-sm leading-none">BnM</p>
              <p className="text-brand-gray text-[10px] font-body">Worker Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-brand-red text-xs">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-brand-gray-light text-brand-gray">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute top-full right-4 mt-1 bg-white border border-brand-gray-light rounded-2xl shadow-lg p-2 z-50 min-w-[160px] animate-slide-up">
            <div className="px-3 py-2 mb-1 border-b border-brand-gray-light">
              <p className="text-sm font-semibold text-brand-black">{profile?.full_name}</p>
              <p className="text-xs text-brand-gray">{profile?.email}</p>
            </div>
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-brand-gray-light safe-bottom">
        <div className="flex items-stretch max-w-2xl mx-auto w-full">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => [
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-display font-semibold uppercase tracking-wide transition-colors',
                isActive ? 'text-brand-red' : 'text-brand-gray hover:text-brand-black',
              ].join(' ')}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-brand-red/10' : ''}`}>
                    <Icon size={18} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
