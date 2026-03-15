'use client';

import { useState, useEffect } from 'react';
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
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';

interface CategoryForm {
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

const initialForm: CategoryForm = {
  name: '',
  slug: '',
  image_url: '',
  is_active: true,
  display_order: 0,
};

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

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);

        // Fetch product counts for each category
        const counts: Record<string, number> = {};
        for (const cat of categoriesData) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          counts[cat.id] = count || 0;
        }
        setProductCounts(counts);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  // Generate slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form change
  const handleFormChange = (field: keyof CategoryForm, value: string | boolean | number) => {
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

  // Upload image
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('categories')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('categories')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Open add modal
  const openAddModal = () => {
    setForm({
      ...initialForm,
      display_order: categories.length + 1,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setForm({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url || '',
      is_active: category.is_active,
      display_order: category.display_order,
    });
    setImageFile(null);
    setImagePreview(category.image_url || null);
    setIsEditing(true);
    setEditingId(category.id);
    setIsModalOpen(true);
  };

  // Save category
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) imageUrl = url;
      }

      const categoryData = {
        name: form.name.trim(),
        slug: form.slug || generateSlug(form.name),
        image_url: imageUrl || null,
        is_active: form.is_active,
        display_order: form.display_order,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Category updated! ✅');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;
        toast.success('Category added! 📂');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.code === '23505') {
        toast.error('A category with this name already exists');
      } else {
        toast.error('Failed to save category');
      }
    }

    setIsSaving(false);
  };

  // Delete category
  const handleDelete = async (category: Category) => {
    const count = productCounts[category.id] || 0;

    if (count > 0) {
      toast.error(
        `Cannot delete "${category.name}" — it has ${count} products. Remove or move the products first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Move category up/down
  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap display orders
    const tempOrder = newCategories[index].display_order;
    newCategories[index].display_order = newCategories[swapIndex].display_order;
    newCategories[swapIndex].display_order = tempOrder;

    // Swap positions in array
    [newCategories[index], newCategories[swapIndex]] = [
      newCategories[swapIndex],
      newCategories[index],
    ];

    setCategories(newCategories);

    // Update in database
    try {
      await supabase
        .from('categories')
        .update({ display_order: newCategories[index].display_order })
        .eq('id', newCategories[index].id);

      await supabase
        .from('categories')
        .update({ display_order: newCategories[swapIndex].display_order })
        .eq('id', newCategories[swapIndex].id);

      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      fetchCategories();
    }
  };

  // Toggle active status
  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );

      toast.success(
        `Category ${!category.is_active ? 'activated' : 'deactivated'}`
      );
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

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
            Categories Management 📂
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {categories.length} total categories
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <FiPlus size={18} />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
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
            No categories yet
          </p>
          <button
            onClick={openAddModal}
            className="btn-primary mt-4 rounded-xl"
          >
            Add First Category
          </button>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Order
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Image
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Slug
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Products
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {/* Order Controls */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0}
                          className="flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-gray-100 disabled:opacity-30"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <FiArrowUp size={14} />
                        </button>
                        <span
                          className="text-xs font-bold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1}
                          className="flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-gray-100 disabled:opacity-30"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <FiArrowDown size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                            }}
                          >
                            <span className="text-lg">📁</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {category.name}
                      </span>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {category.slug}
                      </span>
                    </td>

                    {/* Products Count */}
                    <td className="px-4 py-3">
                      <span className="badge badge-blue">
                        {productCounts[category.id] || 0} items
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(category)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          category.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {category.is_active ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-all hover:bg-red-200"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {/* Modal Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEditing ? 'Edit Category' : 'Add New Category'} 📂
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
                    Category Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
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
                        <FiImage
                          size={24}
                          style={{ color: 'var(--text-secondary)' }}
                        />
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

                {/* Name */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Pizza, Burgers, Drinks"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Slug (auto-generated)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.slug}
                    onChange={(e) => handleFormChange('slug', e.target.value)}
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="1"
                    value={form.display_order}
                    onChange={(e) =>
                      handleFormChange('display_order', Number(e.target.value))
                    }
                  />
                </div>

                {/* Active Toggle */}
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

                {/* Buttons */}
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
                      <span>
                        {isEditing ? 'Update Category' : 'Add Category'}
                      </span>
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

export default AdminCategoriesPage;