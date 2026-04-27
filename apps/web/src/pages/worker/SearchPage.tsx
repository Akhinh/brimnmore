import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { StockBadge, Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import type { Product } from '../../types'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    const { data } = await supabase.from('products')
      .select('*,product_types(name,color),manufacturers(name)')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
      .order('name').limit(20)
    setResults(data as Product[] || [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-brand-black text-xl">Search Products</h1>
        <p className="text-brand-gray text-sm mt-0.5">Find by name, SKU or manufacturer</p>
      </div>

      <Input placeholder="Type to search…" value={query} onChange={e => doSearch(e.target.value)}
        icon={<Search size={15} />} autoFocus />

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-gray text-sm">No products found for "<strong>{query}</strong>"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-brand-gray text-xs">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
          {results.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {p.product_types && <Badge label={p.product_types.name} color={p.product_types.color} />}
                  </div>
                  <p className="font-body font-semibold text-brand-black text-sm truncate">{p.name}</p>
                  <p className="text-brand-gray text-xs mt-0.5">{p.manufacturers?.name} · <span className="font-mono">{p.sku}</span></p>
                  <p className="font-display font-bold text-brand-red mt-2">{fmt(p.selling_price)} <span className="font-normal text-brand-gray text-xs">/{p.unit}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                  <p className="text-brand-gray text-xs mt-1">{p.quantity} {p.unit}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-brand-gray-light rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search size={22} className="text-brand-gray" />
          </div>
          <p className="text-brand-gray text-sm">Start typing to search the inventory</p>
        </div>
      )}
    </div>
  )
}
