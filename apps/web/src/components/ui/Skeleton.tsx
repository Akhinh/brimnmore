export const SkeletonCard = () => (
  <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-4 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/8" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/8 rounded-lg w-3/4" />
        <div className="h-2 bg-white/6 rounded-lg w-1/2" />
      </div>
    </div>
    <div className="h-2 bg-white/6 rounded-lg" />
    <div className="h-2 bg-white/6 rounded-lg w-4/5" />
  </div>
)

export const SkeletonCardLight = () => (
  <div className="bg-white rounded-2xl border border-brand-gray-light p-4 space-y-3 animate-pulse shadow-card">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-gray-light" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-brand-gray-light rounded-lg w-3/4" />
        <div className="h-2 bg-brand-gray-light rounded-lg w-1/2" />
      </div>
    </div>
    <div className="h-2 bg-brand-gray-light rounded-lg" />
    <div className="h-2 bg-brand-gray-light rounded-lg w-4/5" />
  </div>
)

export const SkeletonGrid = ({ count = 6, dark = false }: { count?: number; dark?: boolean }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      dark ? <SkeletonCard key={i} /> : <SkeletonCardLight key={i} />
    ))}
  </div>
)

export const SkeletonRow = ({ dark = false }: { dark?: boolean }) => (
  <div className={`rounded-2xl border p-4 flex items-center gap-4 animate-pulse ${dark ? 'bg-brand-black-soft border-white/8' : 'bg-white border-brand-gray-light'}`}>
    <div className={`w-9 h-9 rounded-xl flex-shrink-0 ${dark ? 'bg-white/8' : 'bg-brand-gray-light'}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-3 rounded-lg w-1/2 ${dark ? 'bg-white/8' : 'bg-brand-gray-light'}`} />
      <div className={`h-2 rounded-lg w-1/3 ${dark ? 'bg-white/6' : 'bg-brand-gray-light'}`} />
    </div>
    <div className={`w-16 h-6 rounded-lg ${dark ? 'bg-white/8' : 'bg-brand-gray-light'}`} />
  </div>
)

export const SkeletonList = ({ count = 5, dark = false }: { count?: number; dark?: boolean }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} dark={dark} />
    ))}
  </div>
)

export const SkeletonStat = ({ dark = false }: { dark?: boolean }) => (
  <div className={`rounded-2xl border p-4 animate-pulse ${dark ? 'bg-brand-black-soft border-white/8' : 'bg-white border-brand-gray-light'}`}>
    <div className={`w-8 h-8 rounded-xl mb-3 ${dark ? 'bg-white/8' : 'bg-brand-gray-light'}`} />
    <div className={`h-2 rounded w-1/2 mb-2 ${dark ? 'bg-white/8' : 'bg-brand-gray-light'}`} />
    <div className={`h-6 rounded w-3/4 ${dark ? 'bg-white/10' : 'bg-brand-gray-light'}`} />
  </div>
)

export const SkeletonStats = ({ count = 6, dark = false }: { count?: number; dark?: boolean }) => (
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStat key={i} dark={dark} />
    ))}
  </div>
)