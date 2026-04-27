export const Spinner = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#E8191A" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-brand-red flex items-center justify-center shadow-brand">
        <span className="font-display font-black text-white text-xl">B</span>
      </div>
      <div className="absolute -inset-2 rounded-2xl border-2 border-brand-red/20 animate-ping" />
    </div>
    <p className="text-sm text-brand-gray font-body animate-pulse">Loading BnM…</p>
  </div>
)
