'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Category } from '@/types';
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
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiAlertCircle,
  FiCheck,
  FiPackage,
  FiStar,
  FiLayers,
} from 'react-icons/fi';

interface CategoryForm {
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

const initialForm: CategoryForm = {
  name: '', slug: '', image_url: '', is_active: true, display_order: 0,
};

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 12;

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Detail drawer
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, popular: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);

        const counts: Record<string, number> = {};
        let maxCount = 0;
        let popularName = '';

        for (const cat of categoriesData) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          counts[cat.id] = count || 0;
          if ((count || 0) > maxCount) { maxCount = count || 0; popularName = cat.name; }
        }

        setProductCounts(counts);
        setStats({
          total: categoriesData.length,
          active: categoriesData.filter(c => c.is_active).length,
          inactive: categoriesData.filter(c => !c.is_active).length,
          popular: popularName || 'N/A',
        });
      }
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);

    setTimeout(() => {
      gsap.fromTo('.cat-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' });
    }, 100);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleFormChange = (field: keyof CategoryForm, value: string | boolean | number) => {
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
      const { error } = await supabase.storage.from('categories').upload(name, file);
      if (error) throw error;
      return supabase.storage.from('categories').getPublicUrl(name).data.publicUrl;
    } catch { toast.error('Upload failed'); return null; }
  };

  const openAddModal = () => {
    setForm({ ...initialForm, display_order: categories.length + 1 });
    setImageFile(null); setImagePreview(null);
    setIsEditing(false); setEditingId(null); setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setForm({ name: category.name, slug: category.slug, image_url: category.image_url || '', is_active: category.is_active, display_order: category.display_order });
    setImageFile(null); setImagePreview(category.image_url || null);
    setIsEditing(true); setEditingId(category.id); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setIsSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) { const url = await uploadImage(imageFile); if (url) imageUrl = url; }

      const data = { name: form.name.trim(), slug: form.slug || generateSlug(form.name), image_url: imageUrl || null, is_active: form.is_active, display_order: form.display_order, updated_at: new Date().toISOString() };

      if (isEditing && editingId) {
        await supabase.from('categories').update(data).eq('id', editingId);
        toast.success('Category updated! ✅');
      } else {
        await supabase.from('categories').insert(data);
        toast.success('Category added! 📂');
      }
      setIsModalOpen(false); fetchCategories();
    } catch (err: any) {
      if (err.code === '23505') toast.error('Category name exists');
      else toast.error('Save failed');
    }
    setIsSaving(false);
  };

  const handleDelete = async (category: Category) => {
    const count = productCounts[category.id] || 0;
    if (count > 0) { toast.error(`Has ${count} products. Remove them first.`); return; }
    if (!confirm(`Delete "${category.name}"?`)) return;
    try {
      await supabase.from('categories').delete().eq('id', category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (category: Category) => {
    try {
      await supabase.from('categories').update({ is_active: !category.is_active, updated_at: new Date().toISOString() }).eq('id', category.id);
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`${!category.is_active ? 'Activated' : 'Deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCats = [...categories];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newCats[index].display_order;
    newCats[index].display_order = newCats[swapIdx].display_order;
    newCats[swapIdx].display_order = temp;
    [newCats[index], newCats[swapIdx]] = [newCats[swapIdx], newCats[index]];
    setCategories(newCats);

    try {
      await supabase.from('categories').update({ display_order: newCats[index].display_order }).eq('id', newCats[index].id);
      await supabase.from('categories').update({ display_order: newCats[swapIdx].display_order }).eq('id', newCats[swapIdx].id);
    } catch { fetchCategories(); }
  };

  // Drawer
  const openDrawer = async (category: Category) => {
    setSelectedCategory(category);
    const { data } = await supabase.from('products').select('id, name, image_url, base_price').eq('category_id', category.id).limit(10);
    if (data) setCategoryProducts(data);
    setIsDrawerOpen(true);
    setTimeout(() => { if (drawerRef.current) gsap.fromTo(drawerRef.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' }); }, 10);
  };

  const closeDrawer = () => {
    if (drawerRef.current) gsap.to(drawerRef.current, { x: '100%', duration: 0.3, ease: 'power3.in', onComplete: () => { setIsDrawerOpen(false); setSelectedCategory(null); } });
  };

  // Filter + Sort
  const filtered = categories
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && c.is_active) || (filterStatus === 'inactive' && !c.is_active);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'order') return a.display_order - b.display_order;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'products') return (productCounts[b.id] || 0) - (productCounts[a.id] || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, sortBy]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 cat-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Categories
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">{stats.total} Categories</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#E8002D' }}>
          <FiPlus size={16} /> Add New Category
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 cat-el">
        {[
          { label: 'Total', value: stats.total, color: '#E8002D', icon: FiLayers },
          { label: 'Active', value: stats.active, color: '#22C55E', icon: FiCheck },
          { label: 'Inactive', value: stats.inactive, color: '#EF4444', icon: FiAlertCircle },
          { label: 'Most Popular', value: stats.popular, color: '#F59E0B', icon: FiStar, isText: true },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ ...glassStyle }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className={`mt-3 ${s.isText ? 'text-sm' : 'text-2xl'} font-bold text-white`} style={!s.isText ? { fontFamily: 'var(--font-jetbrains)' } : {}}>
              {typeof s.value === 'number' ? s.value : s.value}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 cat-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search categories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>

        {[
          { value: filterStatus, onChange: setFilterStatus, options: [{ v: 'all', l: 'All Status' }, { v: 'active', l: '✅ Active' }, { v: 'inactive', l: '❌ Inactive' }] },
          { value: sortBy, onChange: setSortBy, options: [{ v: 'order', l: 'Display Order' }, { v: 'name', l: 'Name A–Z' }, { v: 'products', l: 'Most Products' }] },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.value} onChange={e => f.onChange(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
              {f.options.map(o => <option key={o.v} value={o.v} style={{ backgroundColor: '#111' }}>{o.l}</option>)}
            </select>
            <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        ))}

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ ...glassStyle }}>
          <button onClick={() => setViewMode('grid')} className={`rounded-lg p-2 transition-all ${viewMode === 'grid' ? 'text-white' : 'text-gray-500'}`} style={viewMode === 'grid' ? { backgroundColor: '#E8002D' } : {}}>
            <FiGrid size={14} />
          </button>
          <button onClick={() => setViewMode('list')} className={`rounded-lg p-2 transition-all ${viewMode === 'list' ? 'text-white' : 'text-gray-500'}`} style={viewMode === 'list' ? { backgroundColor: '#E8002D' } : {}}>
            <FiList size={14} />
          </button>
        </div>
      </div>

      {/* Categories */}
      {paginated.length === 0 ? (
        <div className="rounded-xl py-20 text-center cat-el" style={{ ...glassStyle }}>
          <FiAlertCircle size={40} className="mx-auto text-gray-700" />
          <p className="mt-4 text-lg font-semibold text-gray-400">No categories found</p>
          <p className="mt-1 text-sm text-gray-600">Try adjusting your filters</p>
          <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Clear Filters</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 cat-el">
          {paginated.map((category, idx) => (
            <div key={category.id} className="group overflow-hidden rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/5" style={{ ...glassStyle, opacity: category.is_active ? 1 : 0.6 }}>
              {/* Image */}
              <div className="relative h-36 w-full overflow-hidden cursor-pointer" onClick={() => openDrawer(category)}>
                {category.image_url ? (
                  <>
                    <img src={category.image_url} alt={category.name} className="h-full w-full object-cover transition-all duration-500 group-hover:brightness-110 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(232,0,45,0.15) 0%, rgba(0,0,0,0.5) 100%)' }}>
                    <FiLayers size={32} className="text-gray-600" />
                  </div>
                )}
                {/* Product Count */}
                <div className="absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#E8002D' }}>
                  {productCounts[category.id] || 0} Items
                </div>
                {/* Order Controls */}
                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); moveCategory(category.id, 'up'); }} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70">
                    <FiArrowUp size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveCategory(category.id, 'down'); }} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70">
                    <FiArrowDown size={12} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-sm font-semibold text-white">{category.name}</h3>
                  <button onClick={() => toggleActive(category)} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${category.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">Slug: {category.slug}</p>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openDrawer(category)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiEye size={11} /> View
                  </button>
                  <button onClick={() => openEditModal(category)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiEdit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(category)} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    <FiTrash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-xl cat-el" style={{ ...glassStyle }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Order', 'Category', 'Products', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((category, idx) => (
                  <tr key={category.id} className="cursor-pointer transition-all hover:bg-red-500/[0.03]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: category.is_active ? 1 : 0.6 }} onClick={() => openDrawer(category)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); moveCategory(category.id, 'up'); }} className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:text-white"><FiArrowUp size={10} /></button>
                        <span className="text-xs font-bold text-gray-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>{category.display_order}</span>
                        <button onClick={(e) => { e.stopPropagation(); moveCategory(category.id, 'down'); }} className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:text-white"><FiArrowDown size={10} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {category.image_url ? <img src={category.image_url} alt="" className="h-full w-full object-cover" /> : <FiLayers size={16} className="text-gray-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{category.name}</p>
                          <p className="text-[10px] text-gray-500">{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(232,0,45,0.1)', color: '#E8002D' }}>{productCounts[category.id] || 0} Items</span></td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); toggleActive(category); }} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${category.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(category); }} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5" style={{ color: '#E8002D' }}><FiEdit2 size={13} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(category); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={13} /></button>
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
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 cat-el" style={{ ...glassStyle }}>
          <p className="text-xs text-gray-500">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
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

      {/* Category Detail Drawer */}
      {isDrawerOpen && selectedCategory && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeDrawer} />
          <div ref={drawerRef} className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[420px]" style={{ backgroundColor: '#0F0F0F', borderLeft: '1px solid rgba(255,255,255,0.07)', transform: 'translateX(100%)' }}>
            {/* Banner */}
            <div className="relative h-44 w-full overflow-hidden">
              {selectedCategory.image_url ? (
                <><img src={selectedCategory.image_url} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0F0F0F 0%, transparent 60%)' }} /></>
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(232,0,45,0.2), #0F0F0F)' }}><FiLayers size={48} className="text-gray-700" /></div>
              )}
              <button onClick={closeDrawer} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"><FiX size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedCategory.name}</h2>
                <p className="mt-1 text-xs text-gray-500">Slug: {selectedCategory.slug}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(232,0,45,0.1)', color: '#E8002D' }}>{productCounts[selectedCategory.id] || 0} Products</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${selectedCategory.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{selectedCategory.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              {/* Products in category */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Products</p>
                {categoryProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-600">No products</p>
                ) : (
                  <div className="space-y-2">
                    {categoryProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ ...glassStyle }}>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <span>🍕</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{p.name}</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)' }}>Rs. {Number(p.base_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { closeDrawer(); setTimeout(() => openEditModal(selectedCategory), 400); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <FiEdit2 size={14} /> Edit Category
                </button>
                <button onClick={closeDrawer} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>
                  <FiPackage size={14} /> View Products
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '90vh' }}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Edit Category' : 'Add Category'}
                  <span className="ml-1 inline-block h-0.5 w-6 rounded-full" style={{ backgroundColor: '#E8002D' }} />
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Image */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Image</label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ border: '2px dashed rgba(232,0,45,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <FiImage size={24} className="text-gray-600" />}
                    </div>
                    <label className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      Choose <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Name *</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="Category name" value={form.name} onChange={e => handleFormChange('name', e.target.value)} />
                </div>

                {/* Slug */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Slug</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none" style={{ ...glassStyle }} value={form.slug} onChange={e => handleFormChange('slug', e.target.value)} />
                </div>

                {/* Display Order */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Display Order</label>
                  <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="1" value={form.display_order} onChange={e => handleFormChange('display_order', Number(e.target.value))} />
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={e => handleFormChange('is_active', e.target.checked)} className="h-4 w-4 rounded accent-red-600" />
                  <span className="text-xs font-medium text-gray-400">✅ Active</span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : isEditing ? 'Update' : 'Save Category'}
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

export default AdminCategoriesPage;