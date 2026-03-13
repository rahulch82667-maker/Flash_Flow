import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./features/products/productsSlice";
import authReducer from "./features/auth/authSlice";
import usersReducer from "./features/users/usersSlice";
import dashboardReducer from "./features/dashboard/dashboardSlice";
import productsAdminReducer from "./features/products/productsAdminSlice";
import uploadReducer from "./features/upload/uploadSlice";
import categoryProductsReducer from './features/categoryProducts/categoryProductsSlice';
import wishlistReducer from './features/wishlist/wishlistSlice';
import adminWishlistsReducer from './features/adminWishlists/adminWishlistsSlice';
import productReducer from './features/product/productSlice'; 
import similarProductsReducer from './features/similarProducts/similarProductsSlice';
import reviewsReducer from './features/reviews/reviewsSlice';
import adminReviewsReducer from './features/adminReviews/adminReviewsSlice';
import addressReducer from './features/address/addressSlice'; 
import adminAddressesReducer from './features/adminAddresses/adminAddressesSlice';
import cartReducer from './features/cart/cartSlice';
import adminCartReducer from './features/adminCart/adminCartSlice';
import orderReducer from './features/order/orderSlice';
import adminOrdersReducer from './features/adminOrders/adminOrdersSlice'; 
import adminPaymentsReducer from './features/adminPayments/adminPaymentsSlice'; 
import categoryFilterReducer from './features/categoryFilter/categoryFilterSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    auth: authReducer,
    users: usersReducer,
    dashboard: dashboardReducer,
    productsAdmin: productsAdminReducer,
    upload: uploadReducer,
    categoryProducts: categoryProductsReducer,
    wishlist:wishlistReducer ,
    adminWishlists: adminWishlistsReducer,
    product:productReducer,
    similarProducts:similarProductsReducer,
    reviews:reviewsReducer,
    adminReviews : adminReviewsReducer,
    address : addressReducer,
    adminAddresses: adminAddressesReducer,
    cart: cartReducer,
    adminCart: adminCartReducer,
    order: orderReducer,
    adminOrders: adminOrdersReducer, 
    adminPayments: adminPaymentsReducer,
    categoryFilter: categoryFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
