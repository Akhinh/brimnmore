import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Package, Edit2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { StockBadge, Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import type { Product, ProductType, Manufacturer } from '../../types'
import toast from 'react-hot-toast'

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`

const defaultForm = {
  name: '', product_type_id: '', manufacturer_id: '', description: '',
  quantity: '', unit: 'carton', buying_price: '', selling_price: '',
  expiry_date: '', low_stock_threshold: '10', is_featured: false
}

export const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [types, setTypes] = useState<ProductType[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMfg, setFilterMfg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, tRes, mRes] = await Promise.all([
      supabase.from('products').select('*,product_types(name,color),manufacturers(name)').eq('is_active', true).order('name'),
      supabase.from('product_types').select('*').order('name'),
      supabase.from('manufacturers').select('*').order('name'),
    ])
    setProducts(pRes.data as Product[] || [])
    setTypes(tRes.data as ProductType[] || [])
    setManufacturers(mRes.data as Manufacturer[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true) }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, product_type_id: p.product_type_id || '', manufacturer_id: p.manufacturer_id || '',
      description: p.description || '', quantity: String(p.quantity), unit: p.unit,
      buying_price: String(p.buying_price), selling_price: String(p.selling_price),
      expiry_date: p.expiry_date || '', low_stock_threshold: String(p.low_stock_threshold),
      is_featured: p.is_featured,
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.buying_price || !form.selling_price || !form.quantity) {
      toast.error('Please fill all required fields'); return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      product_type_id: form.product_type_id || null,
      manufacturer_id: form.manufacturer_id || null,
      description: form.description || null,
      quantity: parseInt(form.quantity),
      unit: form.unit,
      buying_price: parseFloat(form.buying_price),
      selling_price: parseFloat(form.selling_price),
      expiry_date: form.expiry_date || null,
      low_stock_threshold: parseInt(form.low_stock_threshold),
      is_featured: form.is_featured,
      ...(editing ? {} : { total_stocked: parseInt(form.quantity) }),
    }
    try {
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Product updated!')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        toast.success('Product added!')
      }
      setShowModal(false); load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally { setSaving(false) }
  }

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    toast.success(p.is_active ? 'Product hidden' : 'Product visible')
    load()
  }

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.manufacturers?.name?.toLowerCase().includes(s)
    const matchType = !filterType || p.product_type_id === filterType
    const matchMfg = !filterMfg || p.manufacturer_id === filterMfg
    return matchSearch && matchType && matchMfg
  })

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Inventory</h1>
          <p className="text-white/40 text-sm mt-0.5 font-body">{products.length} products total</p>
        </div>
        <Button onClick={openAdd} icon={<Plus size={16} />} size="sm">Add Product</Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input dark placeholder="Search products, SKU, manufacturer..." value={search}
            onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} className="flex-1" />
          <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={15} />} className="border-white/10 text-white/60 hover:text-white shrink-0">
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <Select dark label="Type" value={filterType} onChange={e => setFilterType(e.target.value)}
              placeholder="All types" options={types.map(t => ({ value: t.id, label: t.name }))} />
            <Select dark label="Manufacturer" value={filterMfg} onChange={e => setFilterMfg(e.target.value)}
              placeholder="All manufacturers" options={manufacturers.map(m => ({ value: m.id, label: m.name }))} />
          </div>
        )}
      </div>

      {/* Product List */}
      {loading ? (
        <SkeletonGrid count={6} dark />
      ) : filtered.length === 0 ? (
        <EmptyState dark icon={<Package size={24} className="text-white/30" />}
          title="No products found" subtitle="Try adjusting your search or filters"
          action={<Button onClick={openAdd} size="sm" icon={<Plus size={14} />}>Add Product</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-brand-black-soft rounded-2xl border border-white/8 p-4 hover:border-white/15 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {p.product_types && <Badge label={p.product_types.name} color={p.product_types.color} />}
                    {p.is_featured && <Badge label="Featured" color="#F97316" />}
                  </div>
                  <h3 className="font-display font-semibold text-white text-sm truncate">{p.name}</h3>
                  <p className="text-white/30 text-xs mt-0.5 font-body">{p.manufacturers?.name} · {p.sku}</p>
                </div>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    {p.is_active ? <ToggleRight size={13} className="text-emerald-400" /> : <ToggleLeft size={13} />}
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/5">
                <div>
                  <p className="text-white/30 text-[10px] font-display uppercase tracking-wider">Sell / Buy</p>
                  <p className="text-white font-display font-semibold text-sm">{fmt(p.selling_price)}</p>
                  <p className="text-white/30 text-xs">Cost: {fmt(p.buying_price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[10px] font-display uppercase tracking-wider mb-1">Stock</p>
                  <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                  <p className="text-white font-display font-semibold text-sm mt-1">
                    {p.quantity} <span className="text-white/30 font-normal text-xs">{p.unit}s left</span>
                  </p>
                  <p className="text-white/20 text-xs">{p.total_stocked ?? p.quantity} stocked total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal dark open={showModal} onClose={() => setShowModal(false)} size="lg"
        title={editing ? 'Edit Product' : 'Add New Product'}
        subtitle={editing ? `Editing ${editing.name}` : 'Fill in the product details below'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input dark label="Product Name *" placeholder="e.g. Digestive Biscuit" value={form.name} onChange={f('name')} />
            </div>
            <Select dark label="Product Type" value={form.product_type_id} onChange={f('product_type_id')}
              placeholder="Select type" options={types.map(t => ({ value: t.id, label: t.name }))} />
            <Select dark label="Manufacturer" value={form.manufacturer_id} onChange={f('manufacturer_id')}
              placeholder="Select manufacturer" options={manufacturers.map(m => ({ value: m.id, label: m.name }))} />
            <Input dark label="Quantity *" type="number" placeholder="0" value={form.quantity} onChange={f('quantity')} />
            <Select dark label="Unit" value={form.unit} onChange={f('unit')}
              options={[
                { value: 'carton', label: 'Carton' }, { value: 'pack', label: 'Pack' },
                { value: 'piece', label: 'Piece' }, { value: 'bag', label: 'Bag' },
                { value: 'box', label: 'Box' }, { value: 'dozen', label: 'Dozen' },
              ]} />
            <Input dark label="Buying Price (N) *" type="number" placeholder="0.00" value={form.buying_price} onChange={f('buying_price')} />
            <Input dark label="Selling Price (N) *" type="number" placeholder="0.00" value={form.selling_price} onChange={f('selling_price')} />
            <Input dark label="Low Stock Alert (threshold)" type="number" placeholder="10" value={form.low_stock_threshold} onChange={f('low_stock_threshold')} />
            <Input dark label="Expiry Date (optional)" type="date" value={form.expiry_date} onChange={f('expiry_date')} />
            <div className="sm:col-span-2">
              <Input dark label="Description (optional)" placeholder="Short description of the product" value={form.description} onChange={f('description')} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="featured" checked={form.is_featured}
                onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                className="w-4 h-4 rounded" />
              <label htmlFor="featured" className="text-white/70 text-sm font-body cursor-pointer">Mark as featured product</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-white/50 hover:text-white hover:bg-white/8 flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
