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
              <div className="relative h-32 w-full overflow-hidden rounded-2xl sm:h-40">
                <img
                  src={categoryImage}
                  alt={categoryName}
                  className="h-full w-full object-cover"
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
                {/* Category Name on Image */}
                <div className="absolute inset-0 flex items-center px-6 sm:px-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                      {categoryName}
                    </h2>
                    <p className="mt-1 text-sm text-white/70">
                      {products.length} {products.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
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