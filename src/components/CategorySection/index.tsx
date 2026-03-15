'use client';

import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface CategorySectionProps {
  categoryId: string;
  categoryName: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const CategorySection = ({
  categoryId,
  categoryName,
  products,
  onProductClick,
}: CategorySectionProps) => {
  if (products.length === 0) return null;

  return (
    <section
      id={`category-${categoryId}`}
      className="scroll-mt-16"
    >
      <div className="container-custom py-6 sm:py-8">
        {/* Category Title */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="h-8 w-1.5 rounded-full bg-primary-600" />
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {categoryName}
          </h2>
          <div
            className="hidden h-px flex-1 sm:block"
            style={{ backgroundColor: 'var(--border-color)' }}
          />
          <span
            className="hidden text-sm sm:block"
            style={{ color: 'var(--text-secondary)' }}
          >
            {products.length} items
          </span>
        </div>

        {/* Products Grid */}
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;