import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: number;
  productId: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  size?: string | null;
  quantity: number;
}

interface DiscountInfo {
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

export interface SuggestedPromo {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  description: string;
  userCanUse: boolean;
  userUsageCount: number;
  userUsageLimit: number;
  expiryDate: string;
}

interface CartState {
  items: CartItem[];
  selectedItems: string[]; // Array of productIds
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  appliedDiscounts: DiscountInfo[]; // Track applied discounts
  promoCode: string | null;
  promoDiscount: number;
  finalTotal: number;
  suggestedPromos: SuggestedPromo[];
  loadingPromos: boolean;
  checkoutAddress: any | null;
}

const initialState: CartState = {
  items: [],
  selectedItems: [],
  loading: false,
  operationLoading: false,
  error: null,
  subtotal: 0,
  discountAmount: 0,
  deliveryCharge: 0,
  total: 0,
  appliedDiscounts: [],
  promoCode: null,
  promoDiscount: 0,
  finalTotal: 0,
  suggestedPromos: [],
  loadingPromos: false,
  checkoutAddress: null,
};

// Fetch cart items
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cart');
    }
  }
);

// Add to cart
export const addToCart = createAsyncThunk(
  'cart/add',
  async (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add to cart');
    }
  }
);

// Update cart item quantity
export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }: { productId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update cart');
    }
  }
);

// Update cart item size
export const updateCartItemSize = createAsyncThunk(
  'cart/updateSize',
  async ({ productId, size }: { productId: string; size: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ size }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update size');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update size');
    }
  }
);

// Remove from cart
export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from cart');
      }

      return productId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove from cart');
    }
  }
);

// Move to wishlist
export const moveToWishlist = createAsyncThunk(
  'cart/moveToWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/${productId}/move-to-wishlist`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move to wishlist');
      }

      return productId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to move to wishlist');
    }
  }
);

// Select/Deselect items
export const toggleSelectItem = createAsyncThunk(
  'cart/toggleSelect',
  async ({ productId, selected }: { productId: string; selected: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId, selected }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update selection');
      }

      return { productId, selected };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update selection');
    }
  }
);

// Select all items
export const selectAllItems = createAsyncThunk(
  'cart/selectAll',
  async (selected: boolean, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/select-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ selected }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update selection');
      }

      return { selected };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update selection');
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear cart');
      }

      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear cart');
    }
  }
);

// Apply promo code
export const applyPromoCode = createAsyncThunk(
  'cart/applyPromo',
  async ({ code, cartTotal }: { code: string; cartTotal: number }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/promos/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, cartTotal }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply promo code');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to apply promo code');
    }
  }
);

// Remove promo code
export const removePromoCode = createAsyncThunk(
  'cart/removePromo',
  async (_, { rejectWithValue }) => {
    try {
      // For now, we'll just clear it locally. In a real app, you might want to call an API
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove promo code');
    }
  }
);

export const fetchSuggestedPromos = createAsyncThunk(
  'cart/fetchSuggestedPromos',
  async ({ minOrder, category }: { minOrder?: number; category?: string } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (minOrder) params.append('minOrder', minOrder.toString());
      if (category) params.append('category', category);
      params.append('limit', '10');

      const response = await fetch(`/api/promos/active?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo suggestions');
      }

      const data = await response.json();
      return data.promos;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch promo suggestions');
    }
  }
);

// Discount calculation function based on subtotal thresholds
const calculateDiscounts = (subtotal: number) => {
  const appliedDiscounts: DiscountInfo[] = [];
  let discountAmount = 0;

  // Discount tiers based on subtotal
  if (subtotal >= 5000) {
    discountAmount = 500; // ₹500 off on orders above ₹5000
    appliedDiscounts.push({
      type: 'fixed',
      value: 500,
      description: '₹500 off on orders above ₹5,000',
    });
  } else if (subtotal >= 3000) {
    discountAmount = 300; // ₹300 off on orders above ₹3000
    appliedDiscounts.push({
      type: 'fixed',
      value: 300,
      description: '₹300 off on orders above ₹3,000',
    });
  } else if (subtotal >= 2000) {
    discountAmount = 150; // ₹150 off on orders above ₹2000
    appliedDiscounts.push({
      type: 'fixed',
      value: 150,
      description: '₹150 off on orders above ₹2,000',
    });
  } else if (subtotal >= 1000) {
    discountAmount = 50; // ₹50 off on orders above ₹1000
    appliedDiscounts.push({
      type: 'fixed',
      value: 50,
      description: '₹50 off on orders above ₹1,000',
    });
  }

  // You can also add percentage-based discounts
  // Example: 10% off on orders above ₹4000
  if (subtotal >= 4000 && subtotal < 5000) {
    const percentageDiscount = subtotal * 0.1; // 10% off
    if (percentageDiscount > discountAmount) {
      discountAmount = percentageDiscount;
      appliedDiscounts.length = 0; // Clear previous discounts
      appliedDiscounts.push({
        type: 'percentage',
        value: 10,
        description: '10% off on orders above ₹4,000',
      });
    }
  }

  return { discountAmount, appliedDiscounts };
};

const calculateTotals = (items: CartItem[], selectedIds: string[], promoDiscount: number = 0) => {
  const selectedItems = items.filter(item => selectedIds.includes(item.productId));
  
  // Calculate subtotal
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate discounts based on subtotal
  const { discountAmount, appliedDiscounts } = calculateDiscounts(subtotal);
  
  // Calculate delivery charge (free above ₹5000)
  const deliveryCharge = subtotal > 5000 ? 0 : 99;
  
  // Calculate final total (subtotal - product discounts - promo discount + delivery)
  const total = subtotal - discountAmount + deliveryCharge;
  const finalTotal = total - promoDiscount;

  return { 
    subtotal, 
    discountAmount,
    deliveryCharge, 
    total,
    finalTotal,
    appliedDiscounts 
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleSelectLocal: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (state.selectedItems.includes(productId)) {
        state.selectedItems = state.selectedItems.filter(id => id !== productId);
      } else {
        state.selectedItems.push(productId);
      }
      const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(state.items, state.selectedItems, state.promoDiscount);
      state.subtotal = subtotal;
      state.discountAmount = discountAmount;
      state.deliveryCharge = deliveryCharge;
      state.total = total;
      state.finalTotal = finalTotal;
      state.appliedDiscounts = appliedDiscounts;
    },
    selectAllLocal: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.selectedItems = state.items.map(item => item.productId);
      } else {
        state.selectedItems = [];
      }
      const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(state.items, state.selectedItems, state.promoDiscount);
      state.subtotal = subtotal;
      state.discountAmount = discountAmount;
      state.deliveryCharge = deliveryCharge;
      state.total = total;
      state.finalTotal = finalTotal;
      state.appliedDiscounts = appliedDiscounts;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCheckoutAddress: (state, action: PayloadAction<any | null>) => {
      state.checkoutAddress = action.payload;
    },
    setPromoData: (state, action: PayloadAction<{ promoCode: string | null; promoDiscount: number }>) => {
      state.promoCode = action.payload.promoCode;
      state.promoDiscount = action.payload.promoDiscount;
      const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(state.items, state.selectedItems, state.promoDiscount);
      state.subtotal = subtotal;
      state.discountAmount = discountAmount;
      state.deliveryCharge = deliveryCharge;
      state.total = total;
      state.finalTotal = finalTotal;
      state.appliedDiscounts = appliedDiscounts;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.selectedItems = action.payload.selectedItems || [];
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.items = action.payload.items || [];
        state.selectedItems = action.payload.selectedItems || [];
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Update quantity
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.selectedItems = action.payload.selectedItems || [];
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Update size
      .addCase(updateCartItemSize.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.productId !== action.payload);
        state.selectedItems = state.selectedItems.filter(id => id !== action.payload);
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Move to wishlist
      .addCase(moveToWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.productId !== action.payload);
        state.selectedItems = state.selectedItems.filter(id => id !== action.payload);
        const { subtotal, discountAmount, deliveryCharge, total, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Toggle select
      .addCase(toggleSelectItem.fulfilled, (state, action) => {
        const { productId, selected } = action.payload;
        if (selected) {
          if (!state.selectedItems.includes(productId)) {
            state.selectedItems.push(productId);
          }
        } else {
          state.selectedItems = state.selectedItems.filter(id => id !== productId);
        }
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Select all
      .addCase(selectAllItems.fulfilled, (state, action) => {
        const { selected } = action.payload;
        state.selectedItems = selected ? state.items.map(item => item.productId) : [];
        const { subtotal, discountAmount, deliveryCharge, total, finalTotal, appliedDiscounts } = calculateTotals(
          state.items,
          state.selectedItems,
          state.promoDiscount
        );
        state.subtotal = subtotal;
        state.discountAmount = discountAmount;
        state.deliveryCharge = deliveryCharge;
        state.total = total;
        state.finalTotal = finalTotal;
        state.appliedDiscounts = appliedDiscounts;
      })

      // Clear cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.selectedItems = [];
        state.subtotal = 0;
        state.discountAmount = 0;
        state.deliveryCharge = 0;
        state.total = 0;
        state.finalTotal = 0;
        state.appliedDiscounts = [];
        state.promoCode = null;
        state.promoDiscount = 0;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("promoCode");
          sessionStorage.removeItem("promoDiscount");
        }
      })

      // Apply promo code
      .addCase(applyPromoCode.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(applyPromoCode.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.promoCode = action.payload.promoCode;
        state.promoDiscount = action.payload.discountAmount;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("promoCode", action.payload.promoCode);
          sessionStorage.setItem("promoDiscount", action.payload.discountAmount.toString());
        }
        const { finalTotal } = calculateTotals(state.items, state.selectedItems, state.promoDiscount);
        state.finalTotal = finalTotal;
      })
      .addCase(applyPromoCode.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Remove promo code
      .addCase(removePromoCode.fulfilled, (state) => {
        state.promoCode = null;
        state.promoDiscount = 0;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("promoCode");
          sessionStorage.removeItem("promoDiscount");
        }
        const { finalTotal } = calculateTotals(state.items, state.selectedItems, 0);
        state.finalTotal = finalTotal;
      })

      // Fetch suggested promos
      .addCase(fetchSuggestedPromos.pending, (state) => {
  state.loadingPromos = true;
  state.error = null;
})
.addCase(fetchSuggestedPromos.fulfilled, (state, action) => {
  state.loadingPromos = false;
  state.suggestedPromos = action.payload;
})
.addCase(fetchSuggestedPromos.rejected, (state, action) => {
  state.loadingPromos = false;
  state.suggestedPromos = [];
  state.error = action.payload as string || 'Failed to fetch promo suggestions';
  console.error('Failed to fetch promos:', action.payload);
});
  },
});

export const { toggleSelectLocal, selectAllLocal, clearError, setCheckoutAddress, setPromoData } = cartSlice.actions;
export default cartSlice.reducer;