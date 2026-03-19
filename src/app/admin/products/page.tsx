'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiSearch,
  FiChevronDown,
  FiGrid,
  FiList,
  FiHeart,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiPackage,
  FiAlertCircle,
  FiCheck,
  FiDownload,
} from 'react-icons/fi';

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  base_price: string;
  is_new_arrival: boolean;
  is_active: boolean;
  is_in_stock: boolean;
  product_type: 'variant' | 'deal';
  image_url: string;
}

interface VariantForm {
  name: string;
  price: string;
  is_default: boolean;
}

interface DealGroupForm {
  group_name: string;
  is_required: boolean;
  items: { name: string; price_adjustment: string; is_default: boolean }[];
}

const initialForm: ProductForm = {
  name: '', slug: '', description: '', category_id: '', base_price: '',
  is_new_arrival: false, is_active: true, is_in_stock: true, product_type: 'variant', image_url: '',
};

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 12;

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [variants, setVariants] = useState<VariantForm[]>([{ name: 'Regular', price: '', is_default: true }]);
  const [dealGroups, setDealGroups] = useState<DealGroupForm[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, newArrivals: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*, category:categories(name), variants:product_variants(*)')
        .order('display_order', { ascending: true });

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (productsData) {
        setProducts(productsData);
        setStats({
          total: productsData.length,
          active: productsData.filter(p => p.is_active).length,
          outOfStock: productsData.filter(p => !p.is_in_stock).length,
          newArrivals: productsData.filter(p => p.is_new_arrival).length,
        });
      }
      if (categoriesData) setCategories(categoriesData);
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);

    setTimeout(() => {
      gsap.fromTo('.prod-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' });
    }, 100);
  };

  // Slug generator
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Form handlers
  const handleFormChange = (field: keyof ProductForm, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') updated.slug = generateSlug(value);
      return updated;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(name, file);
      if (error) throw error;
      return supabase.storage.from('products').getPublicUrl(name).data.publicUrl;
    } catch { toast.error('Upload failed'); return null; }
  };

  // Variant handlers
  const addVariant = () => setVariants(prev => [...prev, { name: '', price: '', is_default: false }]);
  const removeVariant = (i: number) => { if (variants.length <= 1) { toast.error('Min 1 variant'); return; } setVariants(prev => prev.filter((_, idx) => idx !== i)); };
  const updateVariant = (i: number, field: keyof VariantForm, value: string | boolean) => {
    setVariants(prev => prev.map((v, idx) => {
      if (idx === i) return { ...v, [field]: value };
      if (field === 'is_default' && value === true) return { ...v, is_default: false };
      return v;
    }));
  };

  // Deal handlers
  const addDealGroup = () => setDealGroups(prev => [...prev, { group_name: '', is_required: true, items: [{ name: '', price_adjustment: '0', is_default: true }] }]);
  const removeDealGroup = (i: number) => setDealGroups(prev => prev.filter((_, idx) => idx !== i));
  const updateDealGroup = (i: number, field: string, value: string | boolean) => setDealGroups(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  const addDealItem = (gi: number) => setDealGroups(prev => prev.map((g, i) => i === gi ? { ...g, items: [...g.items, { name: '', price_adjustment: '0', is_default: false }] } : g));
  const removeDealItem = (gi: number, ii: number) => setDealGroups(prev => prev.map((g, i) => i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g));
  const updateDealItem = (gi: number, ii: number, field: string, value: string | boolean) => {
    setDealGroups(prev => prev.map((g, i) => i === gi ? {
      ...g, items: g.items.map((item, j) => {
        if (j === ii) return { ...item, [field]: value };
        if (field === 'is_default' && value === true) return { ...item, is_default: false };
        return item;
      })
    } : g));
  };

  // Modal
  const openAddModal = () => {
    setForm(initialForm); setVariants([{ name: 'Regular', price: '', is_default: true }]);
    setDealGroups([]); setImageFile(null); setImagePreview(null);
    setIsEditing(false); setEditingId(null); setIsModalOpen(true);
  };

  const openEditModal = async (product: Product) => {
    setForm({
      name: product.name, slug: product.slug, description: product.description || '',
      category_id: product.category_id, base_price: product.base_price.toString(),
      is_new_arrival: product.is_new_arrival, is_active: product.is_active,
      is_in_stock: product.is_in_stock, product_type: product.product_type || 'variant',
      image_url: product.image_url || '',
    });

    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map(v => ({ name: v.name, price: v.price.toString(), is_default: v.is_default })));
    } else {
      setVariants([{ name: 'Regular', price: product.base_price.toString(), is_default: true }]);
    }

    if (product.product_type === 'deal') {
      try {
        const { data } = await supabase.from('deal_options').select('*, items:deal_option_items(*)').eq('product_id', product.id).order('display_order', { ascending: true });
        if (data && data.length > 0) {
          setDealGroups(data.map((g: any) => ({ group_name: g.group_name, is_required: g.is_required, items: g.items.map((item: any) => ({ name: item.name, price_adjustment: item.price_adjustment.toString(), is_default: item.is_default })) })));
        } else setDealGroups([]);
      } catch { setDealGroups([]); }
    } else setDealGroups([]);

    setImageFile(null); setImagePreview(product.image_url || null);
    setIsEditing(true); setEditingId(product.id); setIsModalOpen(true);
  };

  // Save
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (!form.category_id) { toast.error('Select category'); return; }
    if (!form.base_price || Number(form.base_price) <= 0) { toast.error('Valid price required'); return; }

    if (form.product_type === 'variant') {
      const invalid = variants.filter(v => !v.name.trim() || !v.price || Number(v.price) <= 0);
      if (invalid.length > 0) { toast.error('Fill all variant fields'); return; }
    }

    setIsSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) { const url = await uploadImage(imageFile); if (url) imageUrl = url; }

      const productData = {
        name: form.name.trim(), slug: form.slug || generateSlug(form.name),
        description: form.description.trim() || null, category_id: form.category_id,
        base_price: Number(form.base_price), is_new_arrival: form.is_new_arrival,
        is_active: form.is_active, is_in_stock: form.is_in_stock,
        product_type: form.product_type, image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        await supabase.from('products').update(productData).eq('id', editingId);
        await supabase.from('product_variants').delete().eq('product_id', editingId);
        await supabase.from('product_variants').insert(variants.map(v => ({ product_id: editingId, name: v.name.trim(), price: Number(v.price), is_default: v.is_default })));

        if (form.product_type === 'deal') {
          await supabase.from('deal_options').delete().eq('product_id', editingId);
          for (let i = 0; i < dealGroups.length; i++) {
            const g = dealGroups[i]; if (!g.group_name.trim()) continue;
            const { data: gd } = await supabase.from('deal_options').insert({ product_id: editingId, group_name: g.group_name.trim(), display_order: i, is_required: g.is_required }).select().single();
            if (gd) { const items = g.items.filter(it => it.name.trim()).map(it => ({ deal_option_id: gd.id, name: it.name.trim(), price_adjustment: Number(it.price_adjustment) || 0, is_default: it.is_default })); if (items.length) await supabase.from('deal_option_items').insert(items); }
          }
        }
        toast.success('Product updated! ✅');
      } else {
        const { data: np, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;
        await supabase.from('product_variants').insert(variants.map(v => ({ product_id: np.id, name: v.name.trim(), price: Number(v.price), is_default: v.is_default })));

        if (form.product_type === 'deal' && np) {
          for (let i = 0; i < dealGroups.length; i++) {
            const g = dealGroups[i]; if (!g.group_name.trim()) continue;
            const { data: gd } = await supabase.from('deal_options').insert({ product_id: np.id, group_name: g.group_name.trim(), display_order: i, is_required: g.is_required }).select().single();
            if (gd) { const items = g.items.filter(it => it.name.trim()).map(it => ({ deal_option_id: gd.id, name: it.name.trim(), price_adjustment: Number(it.price_adjustment) || 0, is_default: it.is_default })); if (items.length) await supabase.from('deal_option_items').insert(items); }
          }
        }
        toast.success('Product added! 🍕');
      }
      setIsModalOpen(false); fetchData();
    } catch (err: any) {
      if (err.code === '23505') toast.error('Product name exists');
      else toast.error('Save failed');
    }
    setIsSaving(false);
  };

  // Delete
  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await supabase.from('products').delete().eq('id', product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  // Filter + Sort
  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && p.is_active && p.is_in_stock) || (filterStatus === 'inactive' && !p.is_active) || (filterStatus === 'out_of_stock' && !p.is_in_stock);
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_low') return a.base_price - b.base_price;
      if (sortBy === 'price_high') return b.base_price - a.base_price;
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginated = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory, filterStatus, sortBy]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 prod-el">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Salmond' }}>
            Products
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-poppins)' }}>
            {stats.total} Items Available
          </p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#E8002D' }}>
          <FiPlus size={16} /> Add New Product
        </button>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 prod-el">
        {[
          { label: 'Total Products', value: stats.total, color: '#E8002D', icon: FiPackage },
          { label: 'Active Items', value: stats.active, color: '#22C55E', icon: FiCheck },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#F59E0B', icon: FiAlertCircle },
          { label: 'New Arrivals', value: stats.newArrivals, color: '#3B82F6', icon: FiStar },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ ...glassStyle }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 prod-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>

        {[
          { value: filterCategory, onChange: (v: string) => setFilterCategory(v), options: [{ v: 'all', l: 'All Categories' }, ...categories.map(c => ({ v: c.id, l: c.name }))] },
          { value: filterStatus, onChange: (v: string) => setFilterStatus(v), options: [{ v: 'all', l: 'All Status' }, { v: 'active', l: '✅ Active' }, { v: 'inactive', l: '❌ Inactive' }, { v: 'out_of_stock', l: '⚠️ Out of Stock' }] },
          { value: sortBy, onChange: (v: string) => setSortBy(v), options: [{ v: 'newest', l: 'Newest' }, { v: 'price_low', l: 'Price: Low → High' }, { v: 'price_high', l: 'Price: High → Low' }] },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.value} onChange={e => f.onChange(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
              {f.options.map(o => <option key={o.v} value={o.v} style={{ backgroundColor: '#111' }}>{o.l}</option>)}
            </select>
            <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        ))}

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ ...glassStyle }}>
          <button onClick={() => setViewMode('grid')} className={`rounded-lg p-2 transition-all ${viewMode === 'grid' ? 'text-white' : 'text-gray-500'}`} style={viewMode === 'grid' ? { backgroundColor: '#E8002D' } : {}}>
            <FiGrid size={14} />
          </button>
          <button onClick={() => setViewMode('list')} className={`rounded-lg p-2 transition-all ${viewMode === 'list' ? 'text-white' : 'text-gray-500'}`} style={viewMode === 'list' ? { backgroundColor: '#E8002D' } : {}}>
            <FiList size={14} />
          </button>
        </div>
      </div>

      {/* Products */}
      {paginated.length === 0 ? (
        <div className="rounded-xl py-20 text-center prod-el" style={{ ...glassStyle }}>
          <FiAlertCircle size={40} className="mx-auto text-gray-700" />
          <p className="mt-4 text-lg font-bold text-gray-400" style={{ fontFamily: 'Salmond' }}>No products found</p>
          <p className="mt-1 text-sm text-gray-600">Try adjusting your filters</p>
          <button onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterStatus('all'); }} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 prod-el">
          {paginated.map(product => (
            <div key={product.id} className="group overflow-hidden rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/5" style={{ ...glassStyle, borderColor: 'rgba(255,255,255,0.05)' }}>
              {/* Image */}
              <div className="relative h-44 w-full overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: 'rgba(232,0,45,0.08)' }}>
                    <span className="text-4xl">🍕</span>
                  </div>
                )}
                {/* Category Tag */}
                <div className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase text-white" style={{ backgroundColor: '#E8002D' }}>
                  {(product.category as any)?.name || 'Food'}
                </div>
                {/* Badges */}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  {product.is_new_arrival && <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[8px] font-bold text-white">NEW</span>}
                  {!product.is_in_stock && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold text-white">OUT</span>}
                  {!product.is_active && <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[8px] font-bold text-white">OFF</span>}
                </div>
                {/* Heart */}
                <button className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 transition-all hover:text-red-500">
                  <FiHeart size={12} />
                </button>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <h3 className="truncate text-sm font-bold text-white" style={{ fontFamily: 'Salmond' }}>{product.name}</h3>
                {product.description && <p className="mt-0.5 line-clamp-1 text-[11px] font-light text-gray-500">{product.description}</p>}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)' }}>
                    Rs. {Number(product.base_price).toLocaleString()}
                  </span>
                  {product.variants && product.variants.length > 1 && (
                    <span className="text-[10px] text-gray-500">{product.variants.length} sizes</span>
                  )}
                </div>

                {/* Stock Bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: product.is_in_stock ? '100%' : '0%',
                    backgroundColor: product.is_in_stock ? '#22C55E' : '#EF4444',
                  }} />
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEditModal(product)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiEdit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(product)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    <FiTrash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-xl prod-el" style={{ ...glassStyle }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(product => (
                  <tr key={product.id} className="transition-all hover:bg-red-500/[0.03]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <span>🍕</span>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Salmond' }}>{product.name}</p>
                          {product.description && <p className="line-clamp-1 text-[10px] text-gray-500">{product.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(232,0,45,0.1)', color: '#E8002D' }}>{(product.category as any)?.name}</span></td>
                    <td className="px-4 py-3"><span className="font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>Rs. {Number(product.base_price).toLocaleString()}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${product.is_in_stock ? 'text-green-500' : 'text-red-500'}`}>{product.is_in_stock ? 'In Stock' : 'Out'}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{product.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal(product)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5" style={{ color: '#E8002D' }}><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDelete(product)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 prod-el" style={{ ...glassStyle }}>
          <p className="text-xs text-gray-500">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-30"><FiChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) { if (currentPage <= 3) page = i + 1; else if (currentPage >= totalPages - 2) page = totalPages - 4 + i; else page = currentPage - 2 + i; }
              return <button key={page} onClick={() => setCurrentPage(page)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${currentPage === page ? 'text-white' : 'text-gray-500 hover:bg-white/5'}`} style={currentPage === page ? { backgroundColor: '#E8002D' } : {}}>{page}</button>;
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-30"><FiChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-4 z-50 mx-auto flex max-w-2xl items-start justify-center overflow-y-auto rounded-2xl shadow-2xl sm:inset-10" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-full p-5 sm:p-6">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Salmond' }}>
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                  <span className="ml-1 inline-block h-0.5 w-6 rounded-full" style={{ backgroundColor: '#E8002D' }} />
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Product Image</label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ border: '2px dashed rgba(232,0,45,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <FiImage size={24} className="text-gray-600" />}
                    </div>
                    <label className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      Choose Image <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                </div>

                {/* Name + Slug */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500" style={{ fontFamily: 'Salmond' }}>Name *</label>
                    <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="Product name" value={form.name} onChange={e => handleFormChange('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Slug</label>
                    <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none" style={{ ...glassStyle }} value={form.slug} onChange={e => handleFormChange('slug', e.target.value)} />
                  </div>
                </div>

                {/* Category + Price */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Category *</label>
                    <select className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm text-white outline-none" style={{ ...glassStyle }} value={form.category_id} onChange={e => handleFormChange('category_id', e.target.value)}>
                      <option value="" style={{ backgroundColor: '#111' }}>Select</option>
                      {categories.map(c => <option key={c.id} value={c.id} style={{ backgroundColor: '#111' }}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Base Price (Rs.) *</label>
                    <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="899" value={form.base_price} onChange={e => handleFormChange('base_price', e.target.value)} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Description</label>
                  <textarea className="w-full resize-none rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} rows={3} placeholder="Describe..." value={form.description} onChange={e => handleFormChange('description', e.target.value)} />
                </div>

                {/* Product Type */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Type *</label>
                  <div className="flex gap-3">
                    {[{ v: 'variant' as const, l: '📏 Variant (Sizes)' }, { v: 'deal' as const, l: '🎁 Deal' }].map(t => (
                      <button key={t.v} onClick={() => handleFormChange('product_type', t.v)} className={`flex-1 rounded-xl px-4 py-3 text-xs font-semibold transition-all ${form.product_type === t.v ? 'text-white' : 'text-gray-500'}`}
                        style={form.product_type === t.v ? { backgroundColor: '#E8002D' } : { ...glassStyle }}>{t.l}</button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { field: 'is_new_arrival' as const, label: '🔥 New Arrival', checked: form.is_new_arrival },
                    { field: 'is_active' as const, label: '✅ Active', checked: form.is_active },
                    { field: 'is_in_stock' as const, label: '📦 In Stock', checked: form.is_in_stock },
                  ].map(t => (
                    <label key={t.field} className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={t.checked} onChange={e => handleFormChange(t.field, e.target.checked)} className="h-4 w-4 rounded accent-red-600" />
                      <span className="text-xs font-medium text-gray-400">{t.label}</span>
                    </label>
                  ))}
                </div>

                {/* Variants */}
                {form.product_type === 'variant' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500" style={{ fontFamily: 'Salmond' }}>Variants *</label>
                      <button onClick={addVariant} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#E8002D' }}><FiPlus size={12} /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {variants.map((v, i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center" style={{ ...glassStyle }}>
                          <input type="text" className="flex-1 rounded-lg border-none px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} placeholder="Size name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} />
                          <div className="flex items-center gap-2">
                            <input type="number" className="w-24 rounded-lg border-none px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} placeholder="Price" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                            <label className="flex items-center gap-1"><input type="radio" name="def_var" checked={v.is_default} onChange={() => updateVariant(i, 'is_default', true)} className="accent-red-600" /><span className="text-[10px] text-gray-500">Default</span></label>
                            <button onClick={() => removeVariant(i)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deal Options */}
                {form.product_type === 'deal' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Deal Groups *</label>
                      <button onClick={addDealGroup} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#E8002D' }}><FiPlus size={12} /> Add Group</button>
                    </div>
                    {dealGroups.length === 0 && <p className="rounded-xl p-4 text-center text-xs text-gray-600" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>Click &quot;Add Group&quot; to add options</p>}
                    <div className="space-y-3">
                      {dealGroups.map((g, gi) => (
                        <div key={gi} className="rounded-xl p-4" style={{ ...glassStyle }}>
                          <div className="mb-3 flex items-center gap-2">
                            <input type="text" className="flex-1 rounded-lg border-none px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} placeholder="Group name (e.g., Choose Drink)" value={g.group_name} onChange={e => updateDealGroup(gi, 'group_name', e.target.value)} />
                            <label className="flex items-center gap-1"><input type="checkbox" checked={g.is_required} onChange={e => updateDealGroup(gi, 'is_required', e.target.checked)} className="accent-red-600" /><span className="text-[10px] text-gray-500">Required</span></label>
                            <button onClick={() => removeDealGroup(gi)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={12} /></button>
                          </div>
                          <div className="space-y-2">
                            {g.items.map((item, ii) => (
                              <div key={ii} className="flex flex-col gap-2 rounded-lg p-2 sm:flex-row sm:items-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <input type="text" className="flex-1 rounded-lg border-none px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} placeholder="Option name" value={item.name} onChange={e => updateDealItem(gi, ii, 'name', e.target.value)} />
                                <div className="flex items-center gap-2">
                                  <input type="number" className="w-24 rounded-lg border-none px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} placeholder="+Rs." value={item.price_adjustment} onChange={e => updateDealItem(gi, ii, 'price_adjustment', e.target.value)} />
                                  <label className="flex items-center gap-1"><input type="radio" name={`dd_${gi}`} checked={item.is_default} onChange={() => updateDealItem(gi, ii, 'is_default', true)} className="accent-red-600" /><span className="text-[10px] text-gray-500">Def</span></label>
                                  <button onClick={() => removeDealItem(gi, ii)} className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:text-red-300"><FiTrash2 size={11} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => addDealItem(gi)} className="mt-2 flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#E8002D' }}><FiPlus size={10} /> Add Option</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : isEditing ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProductsPage;