import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;

  // Actions
  addToCart: (product: Product, variant: ProductVariant, quantity: number, special_instructions: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addToCart: (product, variant, quantity, special_instructions) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.product.id === product.id && item.variant.id === variant.id
        );

        if (existingIndex > -1) {
          // Update quantity if same product + variant exists
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += quantity;
          if (special_instructions) {
            updatedItems[existingIndex].special_instructions = special_instructions;
          }
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${variant.id}-${Date.now()}`,
            product,
            variant,
            quantity,
            special_instructions,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeFromCart: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }
        const updatedItems = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      updateInstructions: (id, instructions) => {
        const updatedItems = get().items.map((item) =>
          item.id === id ? { ...item, special_instructions: instructions } : item
        );
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setCartOpen: (open) => {
        set({ isCartOpen: open });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.variant.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'nonstop-pizza-cart',
    }
  )
);