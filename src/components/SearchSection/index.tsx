'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Product } from '@/types';
import gsap from 'gsap';
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchSectionProps {
  onProductClick: (product: Product) => void;
}

const SearchSection = ({ onProductClick }: SearchSectionProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Animate on mount
  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 3.4 }
      );
    }
  }, []);

  // Search products with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:categories(name), variants:product_variants(*)')
          .eq('is_active', true)
          .ilike('name', `%${query}%`)
          .limit(8);

        if (!error && data) {
          setResults(data);
          setShowResults(true);

          // Animate results
          setTimeout(() => {
            gsap.fromTo(
              '.search-result-item',
              { opacity: 0, y: 10 },
              {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.out',
              }
            );
          }, 50);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  // Handle product click from search
  const handleProductClick = (product: Product) => {
    setShowResults(false);
    setQuery('');
    setResults([]);
    onProductClick(product);
  };

  return (
    <section ref={sectionRef} className="relative z-30 opacity-0">
      <div className="container-custom py-6 sm:py-8">
        {/* Section Title */}
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
            What are you craving? 🍕
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Search for your favorite food items
          </p>
        </div>

        {/* Search Box */}
        <div ref={searchRef} className="relative mx-auto max-w-2xl" style={{ zIndex: 50 }}>
          <div
            className="relative flex items-center overflow-hidden rounded-full shadow-lg transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '2px solid var(--border-color)',
            }}
          >
            {/* Search Icon */}
            <div className="flex items-center pl-5">
              <FiSearch
                size={20}
                className={`transition-colors duration-300 ${
                  query.length > 0 ? 'text-primary-600' : ''
                }`}
                style={{ color: query.length > 0 ? undefined : 'var(--text-secondary)' }}
              />
            </div>

            {/* Input */}
            <input
              type="text"
              placeholder="Search for pizza, burger, drinks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
              className="w-full border-none bg-transparent px-4 py-4 text-sm outline-none sm:text-base"
              style={{ color: 'var(--text-primary)' }}
            />

            {/* Loading Spinner or Clear Button */}
            {isSearching ? (
              <div className="flex items-center pr-5">
                <div className="spinner h-5 w-5 text-primary-600" />
              </div>
            ) : query.length > 0 ? (
              <button
                onClick={clearSearch}
                className="flex items-center pr-5 transition-colors hover:text-primary-600"
                style={{ color: 'var(--text-secondary)' }}
              >
                <FiX size={20} />
              </button>
            ) : null}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div
              className="absolute left-0 right-0 top-full mt-2 max-h-[400px] overflow-y-auto rounded-2xl shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                zIndex: 9999,
              }}
            >
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      className="search-result-item flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-primary-50"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Product Image */}
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-100 sm:h-16 sm:w-16">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🍕</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-semibold sm:text-base">
                          {product.name}
                        </h4>
                        {product.category && (
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {(product.category as unknown as { name: string }).name}
                          </p>
                        )}
                        {product.variants && product.variants.length > 0 && (
                          <p
                            className="text-[10px]"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {product.variants.length} size(s) available
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600 sm:text-base">
                          Rs. {product.base_price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <span className="text-4xl">😕</span>
                  <p
                    className="mt-2 text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    No items found for &quot;{query}&quot;
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchSection;