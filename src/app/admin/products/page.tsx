'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Product, Category, ProductVariant } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiStar,
  FiSearch,
  FiChevronDown,
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
  image_url: string;
}

interface VariantForm {
  name: string;
  price: string;
  is_default: boolean;
}

const initialProductForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  category_id: '',
  base_price: '',
  is_new_arrival: false,
  is_active: true,
  is_in_stock: true,
  image_url: '',
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(initialProductForm);
  const [variants, setVariants] = useState<VariantForm[]>([
    { name: 'Regular', price: '', is_default: true },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

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

      if (productsData) setProducts(productsData);
      if (categoriesData) setCategories(categoriesData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  // Auto generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form change
  const handleFormChange = (field: keyof ProductForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Handle image select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image to Supabase
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Add variant row
  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: '', is_default: false }]);
  };

  // Remove variant row
  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('At least one variant is required');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Update variant
  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === index) {
          const updated = { ...v, [field]: value };
          if (field === 'is_default' && value === true) {
            // Only one default
            return updated;
          }
          return updated;
        }
        if (field === 'is_default' && value === true) {
          return { ...v, is_default: false };
        }
        return v;
      })
    );
  };

  // Open add modal
  const openAddModal = () => {
    setForm(initialProductForm);
    setVariants([{ name: 'Regular', price: '', is_default: true }]);
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open edit modal
const openEditModal = (product: Product) => {
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      category_id: product.category_id,
      base_price: product.base_price.toString(),
      is_new_arrival: product.is_new_arrival,
      is_active: product.is_active,
      is_in_stock: product.is_in_stock,
      image_url: product.image_url || '',
    });
    if (product.variants && product.variants.length > 0) {
      setVariants(
        product.variants.map((v) => ({
          name: v.name,
          price: v.price.toString(),
          is_default: v.is_default,
        }))
      );
    } else {
      setVariants([
        { name: 'Regular', price: product.base_price.toString(), is_default: true },
      ]);
    }

    setImageFile(null);
    setImagePreview(product.image_url || null);
    setIsEditing(true);
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  // Save product
  const handleSave = async () => {
    // Validation
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!form.category_id) {
      toast.error('Please select a category');
      return;
    }
    if (!form.base_price || Number(form.base_price) <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    const invalidVariants = variants.filter(
      (v) => !v.name.trim() || !v.price || Number(v.price) <= 0
    );
    if (invalidVariants.length > 0) {
      toast.error('Please fill all variant names and prices');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = form.image_url;

      // Upload image if new file selected
      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) imageUrl = url;
      }

      const productData = {
        name: form.name.trim(),
        slug: form.slug || generateSlug(form.name),
        description: form.description.trim() || null,
        category_id: form.category_id,
        base_price: Number(form.base_price),
        is_new_arrival: form.is_new_arrival,
        is_active: form.is_active,
        is_in_stock: form.is_in_stock,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (error) throw error;

        // Delete old variants
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', editingId);

        // Insert new variants
        const variantData = variants.map((v) => ({
          product_id: editingId,
          name: v.name.trim(),
          price: Number(v.price),
          is_default: v.is_default,
        }));

        await supabase.from('product_variants').insert(variantData);

        toast.success('Product updated successfully! ✅');
      } else {
        // Create product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Insert variants
        const variantData = variants.map((v) => ({
          product_id: newProduct.id,
          name: v.name.trim(),
          price: Number(v.price),
          is_default: v.is_default,
        }));

        await supabase.from('product_variants').insert(variantData);

        toast.success('Product added successfully! 🍕');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.code === '23505') {
        toast.error('A product with this name already exists');
      } else {
        toast.error('Failed to save product');
      }
    }

    setIsSaving(false);
  };

  // Delete product
  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || p.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Products Management 📦
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {products.length} total products
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 rounded-xl">
          <FiPlus size={18} />
          Add Product
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <FiSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field appearance-none pr-10"
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FiChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span className="text-5xl">📭</span>
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No products found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <span className="text-4xl">🍕</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-2 top-2 flex gap-1">
                  {product.is_new_arrival && (
                    <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      NEW
                    </span>
                  )}
                  {!product.is_active && (
                    <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      INACTIVE
                    </span>
                  )}
                                    {!product.is_in_stock && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      OUT OF STOCK
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="truncate text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {product.name}
                </h3>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {(product.category as unknown as { name: string })?.name || 'No Category'}
                </p>
                <p className="mt-1 text-base font-extrabold text-primary-600">
                  Rs. {Number(product.base_price).toLocaleString()}
                </p>

                {/* Variants count */}
                {product.variants && product.variants.length > 0 && (
                  <p
                    className="mt-1 text-[10px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {product.variants.length} variant(s):{' '}
                    {product.variants.map((v) => v.name).join(', ')}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-100 py-2 text-xs font-medium text-primary-600 transition-all hover:bg-primary-200"
                  >
                    <FiEdit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-100 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-200"
                  >
                    <FiTrash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div
            className="fixed inset-4 z-50 mx-auto flex max-w-2xl items-start justify-center overflow-y-auto rounded-2xl shadow-2xl sm:inset-10"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="w-full p-5 sm:p-6">
              {/* Modal Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEditing ? 'Edit Product' : 'Add New Product'} 🍕
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-gray-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px dashed var(--border-color)',
                      }}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiImage size={24} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                    <div>
                      <label className="btn-secondary cursor-pointer rounded-lg px-4 py-2 text-sm">
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                      </label>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Max 5MB, JPG/PNG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name & Slug */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1.5 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="E.g., Pepperoni Pizza"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1.5 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Slug (auto)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                    />
                  </div>
                </div>

                {/* Category & Base Price */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1.5 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        className="input-field appearance-none pr-10"
                        value={form.category_id}
                        onChange={(e) =>
                          handleFormChange('category_id', e.target.value)
                        }
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="mb-1.5 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Base Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="E.g., 899"
                      value={form.base_price}
                      onChange={(e) =>
                        handleFormChange('base_price', e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Description
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Describe the product..."
                    value={form.description}
                    onChange={(e) =>
                      handleFormChange('description', e.target.value)
                    }
                  />
                </div>

                {/* Toggles */}
                {/* Toggles */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_new_arrival}
                      onChange={(e) =>
                        handleFormChange('is_new_arrival', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      🔥 New Arrival
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        handleFormChange('is_active', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ✅ Active (visible to customers)
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_in_stock}
                      onChange={(e) =>
                        handleFormChange('is_in_stock', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      📦 In Stock
                    </span>
                  </label>
                </div>

                {/* Variants */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Variants (Sizes) *
                    </label>
                    <button
                      onClick={addVariant}
                      className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-all hover:text-primary-700"
                    >
                      <FiPlus size={14} />
                      Add Variant
                    </button>
                  </div>

                  <div className="space-y-2">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-xl p-3"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <input
                          type="text"
                          className="input-field flex-1"
                          placeholder="Size name (e.g., Small)"
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(index, 'name', e.target.value)
                          }
                        />
                        <input
                          type="number"
                          className="input-field w-28"
                          placeholder="Price"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(index, 'price', e.target.value)
                          }
                        />
                        <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap">
                          <input
                            type="radio"
                            name="default_variant"
                            checked={variant.is_default}
                            onChange={() =>
                              updateVariant(index, 'is_default', true)
                            }
                            className="accent-primary-600"
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Default
                          </span>
                        </label>
                        <button
                          onClick={() => removeVariant(index)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-100 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost flex-1 rounded-xl border py-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner h-5 w-5" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Update Product' : 'Add Product'}</span>
                    )}
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