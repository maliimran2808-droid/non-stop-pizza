'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, DealOption, DealOptionItem } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase-client';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { FiX, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedDealOptions {
  [groupId: string]: DealOptionItem;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [dealOptions, setDealOptions] = useState<DealOption[]>([]);
  const [selectedDealOptions, setSelectedDealOptions] = useState<SelectedDealOptions>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();

  // Set default variant when product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0];
      setSelectedVariant(defaultVariant);
    } else if (product) {
      setSelectedVariant({
        id: 'default',
        product_id: product.id,
        name: 'Regular',
        price: product.base_price,
        is_default: true,
        created_at: '',
      });
    }
    setQuantity(1);
    setSpecialInstructions('');
    setSelectedDealOptions({});
  }, [product]);

  // Fetch deal options if product is a deal
  useEffect(() => {
    if (!product || product.product_type !== 'deal') {
      setDealOptions([]);
      return;
    }

    const fetchDealOptions = async () => {
      try {
        const { data } = await supabase
          .from('deal_options')
          .select('*, items:deal_option_items(*)')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true });

        if (data) {
          setDealOptions(data);

          // Set defaults
          const defaults: SelectedDealOptions = {};
          data.forEach((group) => {
            if (group.items && group.items.length > 0) {
              const defaultItem = group.items.find((i: DealOptionItem) => i.is_default) || group.items[0];
              defaults[group.id] = defaultItem;
            }
          });
          setSelectedDealOptions(defaults);
        }
      } catch (err) {
        console.error('Error fetching deal options:', err);
      }
    };

    fetchDealOptions();
  }, [product]);

  // Animate open
  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      document.body.style.overflow = 'hidden';

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo(
        modalRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });

      gsap.to(modalRef.current, {
        y: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          document.body.style.overflow = '';
          onClose();
        },
      });
    } else {
      document.body.style.overflow = '';
      onClose();
    }
  };

  // Calculate total price
  const calculatePrice = () => {
    let price = selectedVariant?.price || product?.base_price || 0;

    // Add deal option price adjustments
    Object.values(selectedDealOptions).forEach((item) => {
      price += Number(item.price_adjustment || 0);
    });

    return price;
  };

  // Handle deal option selection
  const handleDealOptionSelect = (groupId: string, item: DealOptionItem) => {
    setSelectedDealOptions((prev) => ({
      ...prev,
      [groupId]: item,
    }));
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    // Build special instructions with deal options
    let instructions = specialInstructions;
    if (Object.keys(selectedDealOptions).length > 0) {
      const dealChoices = dealOptions
        .map((group) => {
          const selected = selectedDealOptions[group.id];
          return selected ? `${group.group_name}: ${selected.name}` : '';
        })
        .filter(Boolean)
        .join(' | ');

      if (dealChoices) {
        instructions = instructions
          ? `${dealChoices} || ${instructions}`
          : dealChoices;
      }
    }

    // Create a modified variant with calculated price
    const finalVariant = {
      ...selectedVariant,
      price: calculatePrice(),
    };

    addToCart(product, finalVariant, quantity, instructions);
    toast.success(`${product.name} added to cart! 🍕`, {
      icon: '🛒',
    });
    handleClose();
  };

  if (!isOpen || !product) return null;

  const totalPrice = calculatePrice() * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full overflow-auto rounded-3xl shadow-2xl sm:max-w-[90%] lg:max-w-[85vw]"
        style={{
          backgroundColor: 'var(--product-model)',
          border:'1px solid grey',
          maxHeight:'85vh'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute text-white right-4 top-4 z-20 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full bg-primary-600 text-white transition-all"
        >
          <FiX size={18} />
        </button>

        {/* Main Content — Image Left + Details Right */}
        <div className="flex flex-col sm:flex-row">
          {/* LEFT — Product Image */}
          <div className="relative h-auto w-full flex-shrink-0 p-4 overflow-hidden sm:h-auto sm:w-1/3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-auto w-100 mx-auto object-contain"
              />
            ) : (
              <div className="flex h-full min-h-[250px] w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <span className="text-7xl">🍕</span>
              </div>
            )}

        

            {!product.is_in_stock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — Product Details */}
          <div className="flex flex-1 flex-col">
           

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto p-5 sm:p-6"
              style={{ maxHeight: '55vh', borderLeft:'1px solid grey' }}

            >
               {/* Name */}
              <h2
                className="text-xl font-bold sm:text-2xl"
                style={{  fontFamily:'Salmond', color: 'var(--text-primary)'}}
              >
                {product.name}
              </h2>
             

              {/* Price */}
              <p className="mt-2 text-2xl font-extrabold" style={{fontFamily:'Salmond', fontSize:'1.3rem', color:'var(--text-primary)'}}>
                Rs. {calculatePrice().toLocaleString()}
              </p>
 {/* Description */}
              {product.description && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--text-secondary)', fontFamily:'Poppins',maxWidth:'90%' }}
                >
                  {product.description}
                </p>
              )}
              {/* Variants (for variant type products) */}
              {product.product_type !== 'deal' &&
                product.variants &&
                product.variants.length > 0 && (
                  <div className="mt-5">
                    <h3
                      className="mb-2 font-semibold"
                      style={{ color: 'var(--text-primary)', fontFamily:'Salmond' }}
                    >
                      Choose your Option
                    </h3>
                    <div className="flex flex-wrap gap-2" style={{flexDirection:"column"}}>
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-300 ${
                            selectedVariant?.id === variant.id
                              ? 'bg-primary-600 text-white shadow-md'
                              : ''
                          }`}
                          style={
                            selectedVariant?.id !== variant.id
                              ? {
                                  backgroundColor: 'var(--input-bg)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  fontFamily:'Poppins',
                                }
                              : {fontFamily:'Poppins'}
                          }
                        >
                          <span>{variant.name}</span>
                          <span className="ml-2 font-bold">
                            Rs. {variant.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Deal Options (for deal type products) */}
              {product.product_type === 'deal' &&
                dealOptions.length > 0 &&
                dealOptions.map((group) => (
                  <div key={group.id} className="mt-5">
                    <h3
                      className="mb-2 text-sm font-semibold"
                      style={{ color: 'var(--text-primary)', fontFamily:'Salmond', fontSize:'.9rem' }}
                    >
                      {group.group_name}
                      {group.is_required && (
                        <span className="ml-1 text-xs text-red-500">*</span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2 outline-none" style={{flexDirection:"column"}}>
                      {group.items?.map((item) => {
                        const isSelected =
                          selectedDealOptions[group.id]?.id === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              handleDealOptionSelect(group.id, item)
                            }
                            className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-md'
                                : ''
                            }`}
                            style={
                              !isSelected
                                ? {
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    fontFamily:'Poppins',
                                  }
                                : {fontFamily:'Poppins'}
                            }
                          >
                            <span>{item.name}</span>
                            {Number(item.price_adjustment) > 0 && (
                              <span className="ml-1 text-xs opacity-80">
                                (+Rs. {item.price_adjustment})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

              {/* Special Instructions */}
              <div className="mt-5">
                <h3
                  className="mb-2 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' , fontFamily:'Salmond'}}
                >
                  Special Instructions (Optional)
                </h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="E.g., Extra cheese, no onions, less spicy..."
                  rows={2}
                  className="input-field resize-none"
                  style={{backgroundColor:'transparent',fontFamily:'Gotham', borderRadius:'0px'}}
                />
              </div>
            </div>

            {/* Bottom Bar — Quantity + Add to Cart (Fixed at bottom) */}
            <div
              className="flex items-center justify-between gap-4 border-t p-4 sm:p-5"
              style={{ borderColor: 'grey' }}
            >
              {/* Quantity Counter — Left */}
              <div
                className="flex items-center gap-3 rounded-full px-2 py-1"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-[14px] cursor-pointer transition-all"
                  style={{ color: 'var(--text-primary)', backgroundColor:'grey'  }}
                >
                  <FiMinus size={22} />
                </button>
                <span
                  className="min-w-[16px] text-center font-bold"
                  style={{ color: 'var(--text-primary)', fontFamily:'Poppins', fontSize:'1.4rem'}}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-[14px] cursor-pointer bg-primary-600 text-white transition-all hover:bg-primary-700"
                >
                  <FiPlus size={22} />
                </button>
              </div>

              {/* Add to Cart Button — Right */}
              <button
                onClick={handleAddToCart}
                disabled={!product.is_in_stock}
                style={{borderRadius:'5px', fontFamily:'Salmond', fontSize:'1.2rem', padding:'0px'}}
                className="btn-primary flex flex-1 items-center justify-between gap-2  text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                <span className='flex item-center justify-center pt-3 px-5 pb-1.5'>
                  Rs. {totalPrice.toLocaleString()}
                </span>
                <span className='flex item-center justify-center pt-3 px-5 pb-1.5'>
                  Add to Cart 
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;