import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isNewArrival: boolean;
  isTrending: boolean;
}

interface ProductsState {
  menProducts: Product[];
  womenProducts: Product[];
  beautyProducts: Product[];
  loading: {
    men: boolean;
    women: boolean;
    beauty: boolean;
  };
  error: {
    men: string | null;
    women: string | null;
    beauty: string | null;
  };
  search: {
    results: Product[];
    suggestions: any[];
    isSpecificProduct: boolean;
    pagination: { page: number; limit: number; total: number; pages: number };
    loading: boolean;
    suggestionsLoading: boolean;
    error: string | null;
  };
}

const initialState: ProductsState = {
  menProducts: [],
  womenProducts: [],
  beautyProducts: [],
  loading: {
    men: false,
    women: false,
    beauty: false,
  },
  error: {
    men: null,
    women: null,
    beauty: null,
  },
  search: {
    results: [],
    suggestions: [],
    isSpecificProduct: false,
    pagination: { page: 1, limit: 12, total: 0, pages: 1 },
    loading: false,
    suggestionsLoading: false,
    error: null,
  }
};

// Async thunks for fetching products by category
export const fetchMenProducts = createAsyncThunk(
  'products/fetchMen',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/products?category=men&limit=5');
      if (!response.ok) throw new Error('Failed to fetch men products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch');
    }
  }
);

export const fetchWomenProducts = createAsyncThunk(
  'products/fetchWomen',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/products?category=women&limit=5');
      if (!response.ok) throw new Error('Failed to fetch women products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch');
    }
  }
);

export const fetchBeautyProducts = createAsyncThunk(
  'products/fetchBeauty',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/products?category=beauty&limit=5');
      if (!response.ok) throw new Error('Failed to fetch beauty products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch');
    }
  }
);

// Search Thunks
export const fetchSearchedProducts = createAsyncThunk(
  'products/fetchSearch',
  async (params: URLSearchParams, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/products/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data; // { products, isSpecificProduct, pagination }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search');
    }
  }
);

export const fetchSearchSuggestions = createAsyncThunk(
  'products/fetchSuggestions',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Suggestions failed');
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch suggestions');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  extraReducers: (builder) => {
    builder
      // Men Products
      .addCase(fetchMenProducts.pending, (state) => {
        state.loading.men = true;
        state.error.men = null;
      })
      .addCase(fetchMenProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading.men = false;
        state.menProducts = action.payload;
      })
      .addCase(fetchMenProducts.rejected, (state, action) => {
        state.loading.men = false;
        state.error.men = action.payload as string;
      })
      
      // Women Products
      .addCase(fetchWomenProducts.pending, (state) => {
        state.loading.women = true;
        state.error.women = null;
      })
      .addCase(fetchWomenProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading.women = false;
        state.womenProducts = action.payload;
      })
      .addCase(fetchWomenProducts.rejected, (state, action) => {
        state.loading.women = false;
        state.error.women = action.payload as string;
      })
      
      // Beauty Products
      .addCase(fetchBeautyProducts.pending, (state) => {
        state.loading.beauty = true;
        state.error.beauty = null;
      })
      .addCase(fetchBeautyProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading.beauty = false;
        state.beautyProducts = action.payload;
      })
      .addCase(fetchBeautyProducts.rejected, (state, action) => {
        state.loading.beauty = false;
        state.error.beauty = action.payload as string;
      })
      
      // Search Products
      .addCase(fetchSearchedProducts.pending, (state) => {
        state.search.loading = true;
        state.search.error = null;
      })
      .addCase(fetchSearchedProducts.fulfilled, (state, action) => {
        state.search.loading = false;
        state.search.results = action.payload.products || [];
        state.search.isSpecificProduct = action.payload.isSpecificProduct || false;
        state.search.pagination = action.payload.pagination || { page: 1, limit: 12, total: 0, pages: 1 };
      })
      .addCase(fetchSearchedProducts.rejected, (state, action) => {
        state.search.loading = false;
        state.search.error = action.payload as string;
      })

      // Search Suggestions
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.search.suggestionsLoading = true;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.search.suggestionsLoading = false;
        state.search.suggestions = action.payload;
      })
      .addCase(fetchSearchSuggestions.rejected, (state) => {
        state.search.suggestionsLoading = false;
        state.search.suggestions = [];
      });
  },
  reducers: {
    clearSearchSuggestions: (state) => {
      state.search.suggestions = [];
    },
    clearSearchResults: (state) => {
      state.search.results = [];
      state.search.pagination = { page: 1, limit: 12, total: 0, pages: 1 };
      state.search.isSpecificProduct = false;
    }
  }
});

export const { clearSearchSuggestions, clearSearchResults } = productsSlice.actions;
export default productsSlice.reducer;