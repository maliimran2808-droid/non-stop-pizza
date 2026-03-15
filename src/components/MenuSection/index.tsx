'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Category, Product } from '@/types';
import { useActiveCategoryOnScroll } from '@/hooks/useInView';
import CategorySwitcher from '@/components/CategorySwitcher';
import CategorySection from '@/components/CategorySection';
import NewArrivals from '@/components/NewArrivals';
import ProductModal from '@/components/ProductModal';
import SearchSection from '@/components/SearchSection';

const MenuSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active category based on scroll position
  const categoryIds = categories.map((c) => c.id);
  const activeCategory = useActiveCategoryOnScroll(categoryIds);

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        // Fetch products with variants
        const { data: productsData } = await supabase
          .from('products')
          .select('*, variants:product_variants(*)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoriesData) setCategories(categoriesData);
        if (productsData) {
          setProducts(productsData);
          setNewArrivals(productsData.filter((p: Product) => p.is_new_arrival));
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Scroll to category section when chip is clicked
  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 60;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Handle product click - open modal
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Get products by category
  const getProductsByCategory = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId);
  };

  if (isLoading) {
    return (
      <>
        <SearchSection onProductClick={handleProductClick} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="spinner mx-auto h-10 w-10 text-primary-600" />
            <p
              className="mt-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading menu...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (categories.length === 0) {
    return (
      <>
        <SearchSection onProductClick={handleProductClick} />
        <div className="container-custom py-20 text-center">
          <span className="text-5xl">🍕</span>
          <h3
            className="mt-4 text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Menu Coming Soon!
          </h3>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            We&apos;re preparing something delicious for you. Stay tuned!
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Search Section - Above everything */}
      <SearchSection onProductClick={handleProductClick} />

      {/* Sticky Category Switcher */}
      <CategorySwitcher
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* New Arrivals Section */}
      <NewArrivals
        products={newArrivals}
        onProductClick={handleProductClick}
      />

      {/* Category Sections */}
           {categories.map((category) => {
        const categoryProducts = getProductsByCategory(category.id);
        return (
          <CategorySection
            key={category.id}
            categoryId={category.id}
            categoryName={category.name}
            categoryImage={category.image_url}
            products={categoryProducts}
            onProductClick={handleProductClick}
          />
        );
      })}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default MenuSection;