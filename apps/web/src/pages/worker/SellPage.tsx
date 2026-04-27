import React, { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingBag, Plus, Minus, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import type { Product, CartItem } from '../../types'
import toast from 'react-hot-toast'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const SellPage = () => {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*,product_types(name,color),manufacturers(name)')
      .eq('is_active', true).gt('quantity', 0).order('name')
    setProducts(data as Product[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    return !s || p.name.toLowerCase().includes(s) || p.manufacturers?.name?.toLowerCase().includes(s)
  })

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === p.id)
      if (existing) {
        if (existing.quantity >= p.quantity) { toast.error(`Only ${p.quantity} ${p.unit}s in stock`); return prev }
        return prev.map(c => c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { product: p, quantity: 1 }]
    })
  }

  const updateCart = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.product.id === id
      ? { ...c, quantity: Math.max(1, Math.min(c.quantity + delta, c.product.quantity)) }
      : c).filter(c => c.quantity > 0))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.product.id !== id))

  const total = cart.reduce((s, c) => s + c.product.selling_price * c.quantity, 0)

  const handleSubmit = async () => {
    if (!profile?.id) return
    setSubmitting(true)
    try {
      const { data: sale, error: saleErr } = await supabase.from('sales')
        .insert({ worker_id: profile.id, total_amount: total }).select().single()
      if (saleErr) throw saleErr
      const { error: itemErr } = await supabase.from('sale_items').insert(
        cart.map(c => ({ sale_id: sale.id, product_id: c.product.id, quantity_sold: c.quantity, unit_price: c.product.selling_price }))
      )
      if (itemErr) throw itemErr
      setCart([])
      setShowConfirm(false)
      setSuccess(true)
      load()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record sale')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-brand-black text-xl">Record Sale</h1>
        <p className="text-brand-gray text-sm mt-0.5">Select products and quantities sold</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
          <div>
            <p className="text-emerald-700 font-semibold text-sm">Sale recorded!</p>
            <p className="text-emerald-600 text-xs">Stock has been updated.</p>
          </div>
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-brand-black text-sm flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand-red" /> Cart ({cart.length})
            </h2>
            <p className="font-display font-bold text-brand-red">{fmt(total)}</p>
          </div>
          <div className="space-y-2 mb-4">
            {cart.map(c => (
              <div key={c.product.id} className="flex items-center gap-3 py-2 border-b border-brand-gray-light last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-brand-black text-sm font-body font-medium truncate">{c.product.name}</p>
                  <p className="text-brand-gray text-xs">{fmt(c.product.selling_price)} / {c.product.unit}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateCart(c.product.id, -1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center hover:bg-brand-red hover:text-white transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="font-display font-bold text-brand-black text-sm w-5 text-center">{c.quantity}</span>
                  <button onClick={() => updateCart(c.product.id, 1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center hover:bg-brand-red hover:text-white transition-colors">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => removeFromCart(c.product.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-brand-gray hover:text-red-500 flex items-center justify-center transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button fullWidth onClick={() => setShowConfirm(true)} icon={<Check size={15} />}>
            Record Sale · {fmt(total)}
          </Button>
        </div>
      )}

      <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={24} /></div>
        : filtered.length === 0 ? <EmptyState icon={<ShoppingBag size={24} className="text-brand-gray" />} title="No products found" />
        : (
          <div className="space-y-2">
            {filtered.map(p => {
              const inCart = cart.find(c => c.product.id === p.id)
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-brand-gray-light p-4 flex items-center justify-between gap-3 shadow-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-brand-black text-sm truncate">{p.name}</p>
                    <p className="text-brand-gray text-xs">{p.manufacturers?.name} · {p.quantity} {p.unit}s left</p>
                    <p className="font-display font-bold text-brand-red text-sm mt-1">{fmt(p.selling_price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inCart && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center">
                          <Minus size={12} />
                        </button>
                        <span className="font-display font-bold text-sm w-5 text-center text-brand-black">{inCart.quantity}</span>
                        <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center">
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                    <button onClick={() => addToCart(p)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${inCart ? 'bg-brand-red text-white' : 'bg-brand-gray-light text-brand-gray hover:bg-brand-red hover:text-white'}`}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Sale" subtitle="Review items before recording">
        <div className="space-y-3">
          {cart.map(c => (
            <div key={c.product.id} className="flex justify-between text-sm py-1.5 border-b border-brand-gray-light last:border-0">
              <div>
                <p className="font-medium text-brand-black">{c.product.name}</p>
                <p className="text-brand-gray text-xs">{c.quantity} × {fmt(c.product.selling_price)}</p>
              </div>
              <p className="font-display font-semibold text-brand-black">{fmt(c.product.selling_price * c.quantity)}</p>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t-2 border-brand-black">
            <p className="font-display font-bold text-brand-black">Total</p>
            <p className="font-display font-bold text-brand-red text-lg">{fmt(total)}</p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} loading={submitting} icon={<Check size={14} />} className="flex-1">Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
