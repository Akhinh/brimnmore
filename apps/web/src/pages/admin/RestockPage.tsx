import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCcw, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { StockBadge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import type { Product, RestockHistory } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

export const RestockPage = () => {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [history, setHistory] = useState<RestockHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, hRes] = await Promise.all([
      supabase.from('products').select('*,product_types(name,color),manufacturers(name)').eq('is_active', true).order('name'),
      supabase.from('restock_history').select('*,products(name,unit)').order('created_at', { ascending: false }).limit(30),
    ])
    setProducts(pRes.data as Product[] || [])
    setHistory(hRes.data as RestockHistory[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast.error('Select a product'); return }
    if (!quantity || parseInt(quantity) <= 0) { toast.error('Enter a valid quantity'); return }
    setSaving(true)
    const { error } = await supabase.from('restock_history').insert({
      product_id: selectedProduct, quantity_added: parseInt(quantity),
      note: note.trim() || null, restocked_by: profile?.id,
    })
    if (error) { toast.error('Restock failed'); setSaving(false); return }
    toast.success('Stock updated!')
    setShowModal(false); setSelectedProduct(''); setQuantity(''); setNote('')
    load()
    setSaving(false)
  }

  const lowStock = products.filter(p => p.quantity <= p.low_stock_threshold)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Restock</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">Add inventory to existing products</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />} size="sm">Add Stock</Button>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
          <p className="text-orange-400 text-sm font-semibold mb-3">⚠ {lowStock.length} item{lowStock.length > 1 ? 's' : ''} need restocking</p>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{p.name}</p>
                  <p className="text-white/30 text-xs">{p.manufacturers?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedProduct(p.id); setShowModal(true) }}
                    className="text-brand-red hover:bg-brand-red/10 text-xs px-2">
                    Restock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restock history */}
      <div className="bg-brand-black-soft rounded-2xl border border-white/8 p-5">
        <h2 className="font-display font-semibold text-white text-sm mb-4">Restock History</h2>
        {loading ? <div className="flex justify-center py-8"><Spinner size={24} className="text-white/30" /></div>
          : history.length === 0 ? <EmptyState dark icon={<RefreshCcw size={20} className="text-white/20" />} title="No restock history" subtitle="Restocks will appear here" />
          : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm">{h.products?.name}</p>
                    <p className="text-white/30 text-xs">{format(new Date(h.created_at), 'MMM d, yyyy · h:mm a')}</p>
                    {h.note && <p className="text-white/20 text-xs italic mt-0.5">{h.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-display font-semibold text-sm">+{h.quantity_added}</p>
                    <p className="text-white/30 text-xs">{h.products?.unit}s added</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <Modal dark open={showModal} onClose={() => setShowModal(false)} title="Add Stock" subtitle="Update inventory for a product">
        <form onSubmit={handleRestock} className="space-y-4">
          <Select dark label="Product *" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            placeholder="Choose a product" options={products.map(p => ({ value: p.id, label: `${p.name} (${p.quantity} left)` }))} />
          <Input dark label="Quantity to Add *" type="number" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)} />
          <Input dark label="Note (optional)" placeholder="e.g. Supplier delivery — April batch" value={note} onChange={e => setNote(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-white/40 hover:text-white hover:bg-white/8">Cancel</Button>
            <Button type="submit" loading={saving} icon={<RefreshCcw size={14} />} className="flex-1">Add Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
