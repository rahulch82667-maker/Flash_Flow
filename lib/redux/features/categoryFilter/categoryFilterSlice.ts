import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface FilterProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  isNewArrival: boolean;
  isTrending: boolean;
  createdAt: string;
}

interface FilterState {
  selectedCategory: string | null;
  selectedSubcategories: string[];
  priceRange: [number, number];
  minPrice: number;
  maxPrice: number;
  sortBy: 'newest' | 'price-low' | 'price-high' | null;
  products: FilterProduct[];
  filteredProducts: FilterProduct[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: FilterState = {
  selectedCategory: null,
  selectedSubcategories: [],
  priceRange: [0, 100000],
  minPrice: 0,
  maxPrice: 100000,
  sortBy: null,
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
};

// Fetch products with filters
export const fetchFilteredProducts = createAsyncThunk(
  'categoryFilter/fetchProducts',
  async ({
    category,
    subcategories,
    minPrice,
    maxPrice,
    sortBy,
    page = 1,
    limit = 12,
  }: {
    category?: string | null;
    subcategories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string | null;
    page?: number;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (subcategories && subcategories.length > 0) {
        subcategories.forEach(sub => params.append('subcategories', sub));
      }
      if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/products/filter?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch products');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch products');
    }
  }
);

// Fetch price range for a category
export const fetchPriceRange = createAsyncThunk(
  'categoryFilter/fetchPriceRange',
  async (category: string | null, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/products/price-range?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch price range');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch price range');
    }
  }
);

const categoryFilterSlice = createSlice({
  name: 'categoryFilter',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.selectedSubcategories = [];
      state.pagination.page = 1;
    },
    toggleSubcategory: (state, action: PayloadAction<string>) => {
      const subcategory = action.payload;
      if (state.selectedSubcategories.includes(subcategory)) {
        state.selectedSubcategories = state.selectedSubcategories.filter(s => s !== subcategory);
      } else {
        state.selectedSubcategories.push(subcategory);
      }
      state.pagination.page = 1;
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.priceRange = action.payload;
      state.pagination.page = 1;
    },
    setSortBy: (state, action: PayloadAction<'newest' | 'price-low' | 'price-high' | null>) => {
      state.sortBy = action.payload;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearFilters: (state) => {
      state.selectedSubcategories = [];
      state.priceRange = [state.minPrice, state.maxPrice];
      state.sortBy = null;
      state.pagination.page = 1;
    },
    resetFilters: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch filtered products
      .addCase(fetchFilteredProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.filteredProducts = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFilteredProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch price range
      .addCase(fetchPriceRange.fulfilled, (state, action) => {
        state.minPrice = action.payload.minPrice;
        state.maxPrice = action.payload.maxPrice;
        state.priceRange = [action.payload.minPrice, action.payload.maxPrice];
      });
  },
});

export const {
  setSelectedCategory,
  toggleSubcategory,
  setPriceRange,
  setSortBy,
  setPage,
  clearFilters,
  resetFilters,
} = categoryFilterSlice.actions;

export default categoryFilterSlice.reducer;