import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AdminPayment {
  _id: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  orderStatus?: string;
  refundStatus?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  paymentMethodDistribution: Record<string, number>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

interface AdminPaymentsState {
  payments: AdminPayment[];
  filteredPayments: AdminPayment[];
  selectedPayment: AdminPayment | null;
  stats: PaymentStats;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterByStatus: string;
  filterByMethod: string;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialStats: PaymentStats = {
  totalPayments: 0,
  totalAmount: 0,
  successfulPayments: 0,
  failedPayments: 0,
  refundedAmount: 0,
  paymentMethodDistribution: {},
  dailyRevenue: [],
};

const initialState: AdminPaymentsState = {
  payments: [],
  filteredPayments: [],
  selectedPayment: null,
  stats: initialStats,
  loading: false,
  error: null,
  searchTerm: '',
  filterByStatus: 'all',
  filterByMethod: 'all',
  sortBy: 'newest',
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
};

// Fetch all payments
export const fetchAllPayments = createAsyncThunk(
  'adminPayments/fetchAll',
  async ({ 
    page = 1, 
    limit = 10, 
    search = '', 
    status = 'all', 
    method = 'all',
    sortBy = 'newest' 
  }: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    method?: string;
    sortBy?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (method && method !== 'all') params.append('method', method);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`/api/admin/payments?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payments');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch payments');
    }
  }
);

// Fetch single payment by ID
export const fetchPaymentById = createAsyncThunk(
  'adminPayments/fetchById',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payment');
      }

      const data = await response.json();
      return data.payment;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch payment');
    }
  }
);

// Fetch payment statistics
export const fetchPaymentStats = createAsyncThunk(
  'adminPayments/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/admin/payments/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payment stats');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch payment stats');
    }
  }
);

const adminPaymentsSlice = createSlice({
  name: 'adminPayments',
  initialState,
  reducers: {
    setSelectedPayment: (state, action: PayloadAction<AdminPayment | null>) => {
      state.selectedPayment = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilterByStatus: (state, action: PayloadAction<string>) => {
      state.filterByStatus = action.payload;
    },
    setFilterByMethod: (state, action: PayloadAction<string>) => {
      state.filterByMethod = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'newest' | 'oldest' | 'highest' | 'lowest'>) => {
      state.sortBy = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFilters: (state) => {
      state.searchTerm = '';
      state.filterByStatus = 'all';
      state.filterByMethod = 'all';
      state.sortBy = 'newest';
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all payments
      .addCase(fetchAllPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.filteredPayments = action.payload.payments;
        state.pagination = {
          page: action.payload.pagination.page,
          limit: action.payload.pagination.limit,
          total: action.payload.pagination.total,
          pages: action.payload.pagination.pages,
        };
      })
      .addCase(fetchAllPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single payment
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch payment stats
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { 
  setSelectedPayment, 
  setSearchTerm, 
  setFilterByStatus, 
  setFilterByMethod, 
  setSortBy, 
  setPage, 
  clearError,
  resetFilters 
} = adminPaymentsSlice.actions;

export default adminPaymentsSlice.reducer;