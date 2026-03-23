import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface OrderItem {
  productId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  size?: string;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  addressType: string;
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  refundStatus: "none" | "pending" | "completed" | "failed";
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  loading: boolean;
  processing: boolean;
  error: string | null;
  clientSecret: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: OrderState = {
  currentOrder: null,
  orders: [],
  loading: false,
  processing: false,
  error: null,
  clientSecret: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
};

// Create order
export const createOrder = createAsyncThunk(
  "order/create",
  async (
    orderData: {
      shippingAddress: ShippingAddress;
      paymentMethod: string;
      items: OrderItem[];
      subtotal: number;
      deliveryCharge: number;
      totalAmount: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create order",
      );
    }
  },
);

// Confirm order
export const confirmOrder = createAsyncThunk(
  "order/confirm",
  async (
    {
      orderId,
      paymentIntentId,
      paymentMethod,
    }: {
      orderId: string;
      paymentIntentId?: string;
      paymentMethod: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId, paymentIntentId, paymentMethod }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm order");
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to confirm order",
      );
    }
  },
);

// Fetch user orders
export const fetchUserOrders = createAsyncThunk(
  "order/fetchUserOrders",
  async (
    {
      page = 1,
      limit = 10,
      status,
    }: { page?: number; limit?: number; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (status) params.append("status", status);

      const response = await fetch(`/api/orders/user?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch orders");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch orders",
      );
    }
  },
);

// Fetch single order
export const fetchOrderById = createAsyncThunk(
  "order/fetchById",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch order");
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch order",
      );
    }
  },
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.clientSecret = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.processing = false;
        state.currentOrder = action.payload.order;
        state.clientSecret = action.payload.clientSecret;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload as string;
      })

      // Confirm order
      .addCase(confirmOrder.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(confirmOrder.fulfilled, (state, action) => {
        state.processing = false;
        state.currentOrder = action.payload;
        state.clientSecret = null;
      })
      .addCase(confirmOrder.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload as string;
      })

      // Fetch user orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id,
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentOrder, clearError } = orderSlice.actions;
export default orderSlice.reducer;
