import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AdminOrderItem {
  productId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  size?: string;
}

export interface AdminShippingAddress {
  fullName: string;
  phoneNumber: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  addressType: string;
}

export interface AdminOrder {
  _id: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: AdminOrderItem[];
  shippingAddress: AdminShippingAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  refundStatus?: 'none' | 'pending' | 'completed' | 'failed' | string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  statusDistribution: Record<string, number>;
  paymentMethodDistribution: Record<string, number>;
}

interface AdminOrdersState {
  orders: AdminOrder[];
  filteredOrders: AdminOrder[];
  selectedOrder: AdminOrder | null;
  stats: OrderStats;
  loading: boolean;
  updating: boolean;
  error: string | null;
  searchTerm: string;
  filterByStatus: string;
  filterByPayment: string;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialStats: OrderStats = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  pendingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  statusDistribution: {},
  paymentMethodDistribution: {},
};

const initialState: AdminOrdersState = {
  orders: [],
  filteredOrders: [],
  selectedOrder: null,
  stats: initialStats,
  loading: false,
  updating: false,
  error: null,
  searchTerm: '',
  filterByStatus: 'all',
  filterByPayment: 'all',
  sortBy: 'newest',
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
};

// Fetch all orders
export const fetchAllOrders = createAsyncThunk(
  'adminOrders/fetchAll',
  async ({ 
    page = 1, 
    limit = 10, 
    search = '', 
    status = 'all', 
    payment = 'all',
    sortBy = 'newest' 
  }: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    payment?: string;
    sortBy?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (payment && payment !== 'all') params.append('payment', payment);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

// Fetch single order by ID
export const fetchOrderById = createAsyncThunk(
  'adminOrders/fetchById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch order');
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch order');
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'adminOrders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }
);

// Fetch order statistics
export const fetchOrderStats = createAsyncThunk(
  'adminOrders/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/admin/orders/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch order stats');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch order stats');
    }
  }
);

const adminOrdersSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<AdminOrder | null>) => {
      state.selectedOrder = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilterByStatus: (state, action: PayloadAction<string>) => {
      state.filterByStatus = action.payload;
    },
    setFilterByPayment: (state, action: PayloadAction<string>) => {
      state.filterByPayment = action.payload;
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
      state.filterByPayment = 'all';
      state.sortBy = 'newest';
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.filteredOrders = action.payload.orders;
        state.pagination = {
          page: action.payload.pagination.page,
          limit: action.payload.pagination.limit,
          total: action.payload.pagination.total,
          pages: action.payload.pagination.pages,
        };
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single order
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.orders.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
          state.filteredOrders[index] = action.payload;
        }
        if (state.selectedOrder?._id === action.payload._id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })

      // Fetch order stats
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { 
  setSelectedOrder, 
  setSearchTerm, 
  setFilterByStatus, 
  setFilterByPayment, 
  setSortBy, 
  setPage, 
  clearError,
  resetFilters 
} = adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;