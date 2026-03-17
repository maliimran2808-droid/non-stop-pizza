"use client";

import { useRef, useEffect } from "react";
import { Product } from "@/types";
import gsap from "gsap";
import { FiPlus } from "react-icons/fi";

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  index: number;
}

const ProductCard = ({ product, onProductClick, index }: ProductCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    gsap.set(element, { opacity: 0, y: 40 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: index * 0.05,
            ease: "power3.out",
          });
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [index]);

  const isOutOfStock = !product.is_in_stock;

  return (
    <div
      ref={cardRef}
      className={`card card-bg-color min-w-0 cursor-pointer overflow-visible p-1.5 opacity-0 w-full ${
        isOutOfStock ? "pointer-events-auto" : ""
      }`}
      onClick={() => !isOutOfStock && onProductClick(product)}
      style={
        isOutOfStock
          ? { opacity: 0.7 }
          : { borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }
      }
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-visible">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              borderTopLeftRadius: "15px",
              borderTopRightRadius: "15px",
            }}
            className={`h-full w-full rouned-t-2xl object-contain transition-transform duration-500 ${
              isOutOfStock ? "grayscale" : "hover:scale-102"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <span className="text-5xl">🍕</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* New Arrival Badge */}
        {product.is_new_arrival && !isOutOfStock && (
          <div className="absolute left-[-16] top-[-19] tracking-wider text-white">
            <img src="/new-arrivals/new-arrival.webp" width={60} alt="" />
          </div>
        )}

        {/* Add Button - Only show if in stock */}
      </div>

      {/* Product Info */}
            <div className="p-2 sm:p-4">
        <h3
          className="truncate card-name-title font-bold sm:text-base"
      style={{ color: 'var(--text-primary)', fontFamily:'Salmond' }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="mt-0.5 card-desc line-clamp-1 sm:mt-1 sm:line-clamp-2"
               style={{
              fontFamily: "Poppins",
              lineHeight: "16px",
              color: "var(--product-description)",
            }}
          >
            {product.description}
          </p>
        )}

        <div className="mt-1 add-btn-small flex items-center justify-between sm:mt-2">
         <span
            className={`font-extrabold${
              isOutOfStock ? "line-through opacity-50" : "text-primary"
            }`}
            style={
              isOutOfStock
                ? { color: "var(--text-secondary)" }
                : { fontFamily: "Salmond"}
            }
          >
            Rs. {product.base_price}
          </span>
 {!isOutOfStock && (
            <button
              className="absolute add-btn-small bottom-[-1] right-[-1] flex px-5 pt-1.5 pb-1 cursor-pointer items-center justify-center bg-primary-600 text-white shadow-lg transition-all duration-300 hover:scale-102"
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              style={{
                fontFamily: "Salmond",
                fontSize: "1.3rem",
                borderTopLeftRadius: "10px",
                borderBottomRightRadius: "10px",
              }}
            >
              ADD
            </button>
          )}
          {isOutOfStock ? (
            <span className="text-[10px] font-semibold text-red-500 sm:text-xs">
              Unavailable
            </span>
          ) : (
            product.variants &&
            product.variants.length > 1 && (
              <span
                className="hidden text-[10px] font-medium sm:block sm:text-xs"
                style={{ color: 'var(--text-secondary)', visibility:'hidden' }}
              >
                {product.variants.length} sizes
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
