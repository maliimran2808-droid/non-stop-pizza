'use client';

import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface CategorySectionProps {
  categoryId: string;
  categoryName: string;
  categoryImage: string | null;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const CategorySection = ({
  categoryId,
  categoryName,
  categoryImage,
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
        {/* Category Header with Image */}
        <div className="mb-4 sm:mb-6">
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ minHeight: '120px' }}
          >
            {/* Background Image or Gradient */}
            {categoryImage ? (
              <div className="relative h-auto w-full overflow-hidden rounded-2xl">
                <img
                  src={categoryImage}
                  alt={categoryName}
                  className="h-full w-full object-contain"
                />
                {/* Dark Overlay */}
                
               
               
              </div>
            ) : (
              <div className="flex items-center gap-3">
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
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            )}
          </div>
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