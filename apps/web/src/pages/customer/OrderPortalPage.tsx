import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, Minus, X, ShoppingBag, Check, Phone, User, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StockBadge, Badge } from '../../components/ui/Badge'
import { Spinner, PageLoader } from '../../components/ui/Spinner'
import type { Product, CartItem, OrderLink } from '../../types'
import toast from 'react-hot-toast'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const OrderPortalPage = () => {
  const { token } = useParams<{ token: string }>()
  const [link, setLink] = useState<OrderLink | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<'browse' | 'checkout' | 'success'>('browse')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return }
    const init = async () => {
      const { data: linkData, error } = await supabase.from('order_links').select('*').eq('token', token).eq('is_active', true).single()
      if (error || !linkData) { setInvalid(true); setLoading(false); return }
      setLink(linkData)
      const { data: prods } = await supabase.from('products')
        .select('*,product_types(name,color),manufacturers(name)').eq('is_active', true).gt('quantity', 0).order('name')
      setProducts(prods as Product[] || [])
      setLoading(false)
    }
    init()
  }, [token])

  const types = [...new Map(products.filter(p => p.product_types).map(p => [p.product_type_id, p.product_types])).values()]

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = !s || p.name.toLowerCase().includes(s) || p.manufacturers?.name?.toLowerCase().includes(s)
    const matchType = !filterType || p.product_type_id === filterType
    return matchSearch && matchType
  })

  const addToCart = (p: Product) => setCart(prev => {
    const e = prev.find(c => c.product.id === p.id)
    if (e) { if (e.quantity >= p.quantity) { toast.error(`Only ${p.quantity} available`); return prev }; return prev.map(c => c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c) }
    return [...prev, { product: p, quantity: 1 }]
  })

  const updateCart = (id: string, delta: number) => setCart(prev =>
    prev.map(c => c.product.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0))

  const total = cart.reduce((s, c) => s + c.product.selling_price * c.quantity, 0)

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Your name is required'); return }
    if (cart.length === 0) { toast.error('Add items to your order'); return }
    setSubmitting(true)
    try {
      const { data: order, error: oErr } = await supabase.from('customer_orders').insert({
        order_link_id: link?.id, customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null, customer_note: customerNote.trim() || null,
        total_amount: total,
      }).select().single()
      if (oErr) throw oErr
      await supabase.from('customer_order_items').insert(
        cart.map(c => ({ order_id: order.id, product_id: c.product.id, quantity: c.quantity, unit_price: c.product.selling_price }))
      )
      setOrderId(order.id.slice(0, 8).toUpperCase())
      setStep('success')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit order')
    } finally { setSubmitting(false) }
  }

  if (loading) return <PageLoader />

  if (invalid) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><X size={24} className="text-red-500" /></div>
        <h1 className="font-display font-bold text-brand-black text-xl mb-2">Link Unavailable</h1>
        <p className="text-brand-gray text-sm">This order link is inactive or invalid. Please contact the store for a valid link.</p>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-off-white">
      <div className="text-center max-w-sm animate-slide-up">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Check size={28} className="text-white" />
        </div>
        <h1 className="font-display font-black text-brand-black text-2xl mb-2">Order Placed!</h1>
        <p className="text-brand-gray text-sm mb-5">Your order has been received. The store will reach out to confirm.</p>
        <div className="bg-white rounded-2xl border border-brand-gray-light p-5 mb-5">
          <p className="text-brand-gray text-xs mb-1">Order Reference</p>
          <p className="font-display font-black text-brand-red text-2xl">#BNM-{orderId}</p>
          <div className="mt-3 pt-3 border-t border-brand-gray-light">
            <p className="text-brand-gray text-xs">Total Amount</p>
            <p className="font-display font-bold text-brand-black text-lg">{fmt(total)}</p>
          </div>
        </div>
        <Button fullWidth onClick={() => { setCart([]); setStep('browse'); setCustomerName(''); setCustomerPhone(''); setCustomerNote('') }}>Place Another Order</Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-off-white">
      {/* Hero */}
      <div className="bg-brand-black text-white px-4 pt-10 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">B</span>
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">Brill 'n' More</p>
              <p className="text-white/30 text-[10px]">Wholesale Store</p>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl leading-tight mb-2">Browse & Order<br/>Our Products</h1>
          <p className="text-white/40 text-sm">Select items and quantities, then submit your order.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Cart summary bar */}
        {cart.length > 0 && (
          <div className="sticky top-4 z-30 bg-brand-red rounded-2xl p-4 flex items-center justify-between shadow-brand animate-slide-up">
            <div>
              <p className="font-display font-bold text-white text-sm">{cart.reduce((s, c) => s + c.quantity, 0)} item(s) in cart</p>
              <p className="text-white/70 text-xs">{fmt(total)}</p>
            </div>
            <Button size="sm" onClick={() => setStep('checkout')} className="bg-white text-brand-red hover:bg-white/90">Checkout →</Button>
          </div>
        )}

        {step === 'checkout' ? (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('browse')} className="p-2 rounded-xl bg-white border border-brand-gray-light hover:bg-brand-gray-light transition-colors">
                <X size={16} className="text-brand-gray" />
              </button>
              <h2 className="font-display font-bold text-brand-black text-lg">Your Order</h2>
            </div>

            <div className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
              {cart.map(c => (
                <div key={c.product.id} className="flex items-center justify-between py-2.5 border-b border-brand-gray-light last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-black text-sm font-medium truncate">{c.product.name}</p>
                    <p className="text-brand-gray text-xs">{fmt(c.product.selling_price)} × {c.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateCart(c.product.id, -1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center"><Minus size={11} /></button>
                      <span className="font-display font-bold text-brand-black text-sm w-5 text-center">{c.quantity}</span>
                      <button onClick={() => updateCart(c.product.id, 1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center"><Plus size={11} /></button>
                    </div>
                    <p className="font-display font-semibold text-brand-black text-sm w-16 text-right">{fmt(c.product.selling_price * c.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t-2 border-brand-black mt-2">
                <p className="font-display font-bold text-brand-black">Total</p>
                <p className="font-display font-bold text-brand-red text-lg">{fmt(total)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-brand-black text-sm">Your Details</h3>
              <Input label="Full Name *" placeholder="Your name" value={customerName} onChange={e => setCustomerName(e.target.value)} icon={<User size={15} />} />
              <Input label="Phone Number (optional)" placeholder="+234 XXX XXX XXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} icon={<Phone size={15} />} type="tel" />
              <Input label="Note / Delivery Address (optional)" placeholder="Any special instructions?" value={customerNote} onChange={e => setCustomerNote(e.target.value)} icon={<MessageSquare size={15} />} />
            </div>

            <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} icon={<Check size={16} />}>
              Submit Order · {fmt(total)}
            </Button>
          </div>
        ) : (
          <>
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} />

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setFilterType('')}
                className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold whitespace-nowrap transition-all ${!filterType ? 'bg-brand-black text-white' : 'bg-white text-brand-gray border border-brand-gray-light hover:border-brand-black'}`}>
                All
              </button>
              {types.map(t => t && (
                <button key={t.id} onClick={() => setFilterType(filterType === t.id ? '' : t.id!)}
                  className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold whitespace-nowrap transition-all ${filterType === t.id ? 'text-white' : 'bg-white text-brand-gray border border-brand-gray-light'}`}
                  style={filterType === t.id ? { background: t.color } : {}}>
                  {t.name}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? <div className="text-center py-16 text-brand-gray text-sm">No products found</div>
              : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map(p => {
                    const inCart = cart.find(c => c.product.id === p.id)
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border border-brand-gray-light p-4 shadow-card">
                        {p.product_types && <Badge label={p.product_types.name} color={p.product_types.color} className="mb-2" />}
                        <p className="font-display font-bold text-brand-black text-sm mb-1">{p.name}</p>
                        <p className="text-brand-gray text-xs mb-2">{p.manufacturers?.name}</p>
                        <p className="font-display font-black text-brand-red text-base mb-3">{fmt(p.selling_price)}<span className="text-xs text-brand-gray font-normal"> /{p.unit}</span></p>
                        <div className="flex items-center justify-between">
                          <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                          {inCart ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 rounded-lg bg-brand-gray-light flex items-center justify-center"><Minus size={11} /></button>
                              <span className="font-display font-bold text-brand-black text-sm w-5 text-center">{inCart.quantity}</span>
                              <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 rounded-lg bg-brand-red text-white flex items-center justify-center"><Plus size={11} /></button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-xl bg-brand-black text-white flex items-center justify-center hover:bg-brand-red transition-colors">
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </>
        )}
      </div>
    </div>
  )
}
