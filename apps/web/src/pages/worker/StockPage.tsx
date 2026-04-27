import React, { useState, useEffect, useCallback } from 'react'
import { Package, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { StockBadge, Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import type { Product, ProductType } from '../../types'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const StockPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [types, setTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, tRes] = await Promise.all([
      supabase.from('products').select('*,product_types(name,color),manufacturers(name)').eq('is_active', true).order('name'),
      supabase.from('product_types').select('*').order('name'),
    ])
    setProducts(pRes.data as Product[] || [])
    setTypes(tRes.data as ProductType[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = !s || p.name.toLowerCase().includes(s) || p.manufacturers?.name?.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
    const matchType = !filterType || p.product_type_id === filterType
    return matchSearch && matchType
  })

  const grouped = types.reduce((acc, t) => {
    const items = filtered.filter(p => p.product_type_id === t.id)
    if (items.length > 0) acc[t.id] = { type: t, items }
    return acc
  }, {} as Record<string, { type: ProductType; items: Product[] }>)

  const ungrouped = filtered.filter(p => !p.product_type_id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-brand-black text-xl">Available Stock</h1>
        <p className="text-brand-gray text-sm mt-0.5">{products.length} products in store</p>
      </div>

      <Input placeholder="Search by name, manufacturer or SKU…" value={search}
        onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} />

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold whitespace-nowrap transition-all ${!filterType ? 'bg-brand-red text-white' : 'bg-brand-gray-light text-brand-gray hover:text-brand-black'}`}>
          All Items
        </button>
        {types.map(t => (
          <button key={t.id} onClick={() => setFilterType(filterType === t.id ? '' : t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold whitespace-nowrap transition-all ${filterType === t.id ? 'text-white' : 'bg-brand-gray-light text-brand-gray hover:text-brand-black'}`}
            style={filterType === t.id ? { background: t.color } : {}}>
            {t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={24} className="text-brand-gray" />} title="No products found" subtitle="Try a different search or filter" />
      ) : (
        <div className="space-y-6">
          {Object.values(grouped).map(({ type, items }) => (
            <div key={type.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: type.color }} />
                <h2 className="font-display font-bold text-brand-black text-sm uppercase tracking-wide">{type.name}</h2>
                <span className="text-brand-gray text-xs">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-brand-black text-sm uppercase tracking-wide mb-3">Other</h2>
              <div className="space-y-2">
                {ungrouped.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ProductCard = ({ product: p }: { product: Product }) => (
  <div className="bg-white rounded-2xl border border-brand-gray-light p-4 flex items-center justify-between gap-3 shadow-card">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {p.is_featured && <Badge label="Featured" color="#F97316" />}
      </div>
      <p className="font-body font-semibold text-brand-black text-sm truncate">{p.name}</p>
      <p className="text-brand-gray text-xs mt-0.5">{p.manufacturers?.name} · {p.sku}</p>
      <p className="font-display font-bold text-brand-red mt-1.5 text-sm">{`₦${Number(p.selling_price).toLocaleString('en-NG')}`} <span className="font-normal text-brand-gray">/ {p.unit}</span></p>
    </div>
    <div className="text-right shrink-0">
      <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
      <div className="text-right mt-1">
      <p className="font-display font-semibold text-brand-black text-sm">{p.quantity} <span className="text-brand-gray font-normal text-xs">{p.unit}s left</span></p>
      <p className="text-brand-gray text-xs">{p.total_stocked} stocked</p>
</div>
    </div>
  </div>
)
