import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import PromoCode from '@/models/PromoCode';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Wishlist from '@/models/Wishlist';
import User from '@/models/User';
import Address from '@/models/Address';
import ChatState from '@/models/ChatState';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

// Reusable action creators
const createButton = (label: string, action: string, metadata: any = {}, icon?: string) => ({ label, action, metadata, icon });
const backButton = () => createButton('Back', 'BACK', {}, 'ArrowLeft');

export async function POST(req: NextRequest) {
 try {
 await connectDB();
 const { message, action, metadata = {}, userId: passedUserId, sessionId } = await req.json();

 // Determine user ID
 const token = (await cookies()).get('authToken')?.value;
 let userId = passedUserId || null;
 let user = null;
 
 if (!userId && token) {
 try {
 const decoded = await adminAuth.verifySessionCookie(token, true);
 user = await User.findOne({ email: decoded.email });
 if (user) {
 userId = user._id.toString();
 }
 } catch (err) {
 console.log('Token auth failed');
 }
 }

 const sessionKey = userId || sessionId || 'anonymous-session';

 // Retrieve or initialize ChatState
 let chatState = await ChatState.findOne({ userId: sessionKey });
 if (!chatState) {
 chatState = await ChatState.create({
 userId: sessionKey,
 step: 'MAIN_MENU',
 history: [],
 metadata: {}
 });
 }

 // Handle initial greeting or forced resets
 const isReset = message?.toLowerCase() === 'reset' || message?.toLowerCase() === 'hi' || message?.toLowerCase() === 'hello';
 if (isReset || (!action && !message) || action === 'RESET') {
 chatState.step = 'MAIN_MENU';
 chatState.history = [];
 chatState.metadata = {};
 await chatState.save();
 return NextResponse.json(await renderStep(chatState, userId));
 }

 // Process Action
 if (action === 'BACK') {
 if (chatState.history.length > 0) {
 const previousStep = chatState.history.pop();
 chatState.step = previousStep;
 // Optional: you could save a snapshot of metadata in history, but for simplicity, we keep it as is.
 } else {
 chatState.step = 'MAIN_MENU';
 }
 await chatState.save();
 return NextResponse.json(await renderStep(chatState, userId));
 }

 // Process custom actions by dispatching to the step handler
 await processStepAction(chatState, action, metadata, userId);
 
 // Save updated state and return rendered view
 await chatState.save();
 return NextResponse.json(await renderStep(chatState, userId));

 } catch (error) {
 console.error(' [API] Error:', error);
 return NextResponse.json(
 { error: 'Internal server error', response: 'Sorry, something went wrong on our end.' },
 { status: 500 }
 );
 }
}

// ---------------------------------------------------------------------------
// Action Processor
// ---------------------------------------------------------------------------
async function processStepAction(state: any, action: string, metadata: any, userId: string | null) {
 // Navigation away from MAIN_MENU
 if (state.step === 'MAIN_MENU') {
 state.history.push('MAIN_MENU');
 if (action === 'NAV_SHOP') state.step = 'SHOP_CATEGORY';
 else if (action === 'NAV_CART') state.step = 'CART_VIEW';
 else if (action === 'NAV_ORDERS') state.step = 'ORDERS_VIEW';
 else if (action === 'NAV_PROFILE') state.step = 'PROFILE_VIEW';
 else if (action === 'NAV_WISHLIST') state.step = 'WISHLIST_VIEW';
 else if (action === 'NAV_OFFERS') state.step = 'OFFERS_VIEW';
 return;
 }

 // Shop Flow
 if (state.step === 'SHOP_CATEGORY') {
 if (action === 'SELECT_CATEGORY') {
 state.history.push(state.step);
 state.step = 'PRODUCT_LIST';
 state.metadata = { category: metadata.category };
 }
 return;
 }

 if (state.step === 'PRODUCT_LIST') {
 if (action === 'SELECT_PRODUCT') {
 state.history.push(state.step);
 state.step = 'PRODUCT_DETAILS';
 state.metadata = { ...state.metadata, productId: metadata.productId };
 }
 return;
 }

 if (state.step === 'PRODUCT_DETAILS') {
 if (action === 'ADD_TO_CART') {
 if (!userId) throw new Error("Need Login");
 const cart = await Cart.findOne({ userId });
 if (cart) {
 const product = await Product.findById(state.metadata.productId);
 if (product) {
 const itemIndex = cart.items.findIndex((item: any) => item.productId.toString() === state.metadata.productId);
 if (itemIndex > -1) {
 cart.items[itemIndex].quantity += 1;
 } else {
 cart.items.push({
 productId: product._id,
 title: product.title,
 price: product.price,
 image: product.image || '',
 quantity: 1,
 description: product.description || 'No description',
 category: product.category ? product.category.toLowerCase() : 'men',
 addedAt: new Date(),
 } as any);
 }
 const pIdStr = product._id.toString();
 if (!cart.selectedItems) cart.selectedItems = [];
 if (!cart.selectedItems.includes(pIdStr)) {
 cart.selectedItems.push(pIdStr);
 }
 await cart.save();
 }
 }
 state.metadata.message = " Added to cart!";
 }
 if (action === 'ADD_TO_WISHLIST') {
 if (!userId) throw new Error("Need Login");
 const wishlist = await Wishlist.findOne({ userId });
 if (wishlist) {
 const product = await Product.findById(state.metadata.productId);
 if (product && !wishlist.items.some((item: any) => item.productId.toString() === state.metadata.productId)) {
 wishlist.items.push({
 productId: product._id,
 title: product.title,
 price: product.price,
 image: product.image || '',
 description: product.description || 'No description',
 category: product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase() : 'Men',
 addedAt: new Date(),
 } as any);
 await wishlist.save();
 }
 }
 state.metadata.message = " Added to wishlist!";
 }
 if (action === 'REMOVE_FROM_WISHLIST') {
 if (!userId) throw new Error("Need Login");
 const wishlist = await Wishlist.findOne({ userId });
 if (wishlist) {
 wishlist.items = wishlist.items.filter((item: any) => item.productId.toString() !== state.metadata.productId);
 await wishlist.save();
 state.metadata.message = " Removed from wishlist!";
 }
 }
 return;
 }

 // Cart Flow
 if (state.step === 'CART_VIEW') {
 if (action === 'SELECT_CART_ITEM') {
 state.history.push(state.step);
 state.step = 'CART_ITEM_DETAILS';
 state.metadata = { productId: metadata.productId, title: metadata.title };
 }
 if (action === 'CHECKOUT') {
 state.history.push(state.step);
 state.step = 'CHECKOUT_VIEW';
 }
 if (action === 'NAV_OFFERS') {
 state.history.push(state.step);
 state.step = 'OFFERS_VIEW';
 }
 return;
 }

 if (state.step === 'CART_ITEM_DETAILS') {
 const cart = await Cart.findOne({ userId });
 if (cart) {
 const itemIndex = cart.items.findIndex((item: any) => item.productId.toString() === state.metadata.productId);
 if (itemIndex > -1) {
 if (action === 'INC_QTY') {
 cart.items[itemIndex].quantity += 1;
 } else if (action === 'DEC_QTY') {
 if (cart.items[itemIndex].quantity > 1) {
 cart.items[itemIndex].quantity -= 1;
 }
 } else if (action === 'REMOVE_ITEM') {
 cart.items.splice(itemIndex, 1);
 state.metadata.message = " Item removed.";
 state.step = state.history.pop() || 'CART_VIEW'; // Return to cart
 }
 await cart.save();
 }
 }
 return;
 }

 // Orders Flow
 if (state.step === 'ORDERS_VIEW') {
 if (action === 'SELECT_ORDER') {
 state.history.push(state.step);
 state.step = 'ORDER_DETAILS';
 state.metadata = { ...state.metadata, orderId: metadata.orderId };
 }
 return;
 }

 if (state.step === 'ORDER_DETAILS') {
 if (action === 'TRACK_ORDER') {
 state.metadata.message = " Tracking info: Out for delivery.";
 }
 if (action === 'INITIATE_CANCEL') {
 state.history.push(state.step);
 state.step = 'CONFIRM_CANCEL';
 }
 return;
 }

 if (state.step === 'CONFIRM_CANCEL') {
 if (action === 'CANCEL_ORDER_CONFIRMED') {
 const order = await Order.findOne({ orderId: state.metadata.orderId, userId });
 if (order && ['pending', 'processing', 'confirmed'].includes(order.orderStatus.toLowerCase())) {
 order.orderStatus = 'cancelled';
 await order.save();
 state.step = 'COMPLETED_CANCEL';
 } else {
 state.metadata.message = " Could not cancel order. It may have already been shipped or processed.";
 state.step = state.history.pop() || 'ORDER_DETAILS';
 }
 }
 if (action === 'CANCEL_ABORT') {
 state.step = state.history.pop() || 'ORDER_DETAILS';
 }
 return;
 }

 if (state.step === 'COMPLETED_CANCEL') {
 if (action === 'NAV_ORDERS') {
 state.step = 'ORDERS_VIEW';
 }
 return;
 }

 // Profile Flow
 if (state.step === 'PROFILE_VIEW') {
 if (action === 'MANAGE_ADDRESS') {
 state.history.push(state.step);
 state.step = 'ADDRESS_VIEW';
 }
 return;
 }

 // Wishlist Flow
 if (state.step === 'WISHLIST_VIEW') {
 if (action === 'SELECT_WISHLIST_ITEM') {
 state.history.push(state.step);
 state.step = 'WISHLIST_ITEM_DETAILS';
 state.metadata = { productId: metadata.productId };
 }
 return;
 }

 if (state.step === 'WISHLIST_ITEM_DETAILS') {
 const wishlist = await Wishlist.findOne({ userId });
 if (action === 'REMOVE_ITEM') {
 if (wishlist) {
 wishlist.items = wishlist.items.filter((item: any) => item.productId.toString() !== state.metadata.productId);
 await wishlist.save();
 state.step = state.history.pop() || 'WISHLIST_VIEW';
 }
 }
 if (action === 'MOVE_TO_CART') {
 const cart = await Cart.findOne({ userId });
 const product = await Product.findById(state.metadata.productId);
 if (cart && product) {
 cart.items.push({
 productId: product._id,
 title: product.title,
 price: product.price,
 image: product.image || '',
 quantity: 1,
 description: product.description || 'No description',
 category: product.category ? product.category.toLowerCase() : 'men',
 addedAt: new Date(),
 } as any);
 const pIdStr = product._id.toString();
 if (!cart.selectedItems) cart.selectedItems = [];
 if (!cart.selectedItems.includes(pIdStr)) {
 cart.selectedItems.push(pIdStr);
 }
 await cart.save();
 // Remove from wishlist
 if (wishlist) {
 wishlist.items = wishlist.items.filter((item: any) => item.productId.toString() !== state.metadata.productId);
 await wishlist.save();
 }
 state.metadata.message = " Moved to cart!";
 state.step = state.history.pop() || 'WISHLIST_VIEW';
 }
 }
 return;
 }

 // Offers Flow
 if (state.step === 'OFFERS_VIEW') {
 if (action === 'APPLY_PROMO') {
 state.metadata.message = ` Promo code ${metadata.code} copied and ready for checkout!`;
 }
 return;
 }
}

// ---------------------------------------------------------------------------
// View Renderer
// ---------------------------------------------------------------------------
async function renderStep(state: any, userId: string | null) {
 let responseText = '';
 let buttons: any[] = [];
 let productsData: any[] = []; // Optional extra data

 // Provide contextual feedback
 if (state.metadata?.message) {
 responseText += `${state.metadata.message}\n\n`;
 state.metadata.message = null; // Clear banner
 }

 switch (state.step) {
 case 'MAIN_MENU':
 responseText += " Hello! I am your Flash Flow shopping assistant.\n\nPlease select an option below:";
 buttons = [
 createButton('Shop / Products', 'NAV_SHOP', {}, 'ShoppingBag'),
 createButton('My Cart', 'NAV_CART', {}, 'ShoppingCart'),
 createButton('My Orders', 'NAV_ORDERS', {}, 'Package'),
 createButton('Wishlist', 'NAV_WISHLIST', {}, 'Heart'),
 createButton('Offers', 'NAV_OFFERS', {}, 'Tag'),
 createButton('Profile', 'NAV_PROFILE', {}, 'User'),
 ];
 break;

 case 'SHOP_CATEGORY':
 responseText += "**Shop**\nSelect a category to explore:";
 buttons = [
 createButton('Men', 'SELECT_CATEGORY', { category: 'men' }, 'Shirt'),
 createButton('Women', 'SELECT_CATEGORY', { category: 'women' }, 'UserRound'),
 createButton('Kids', 'SELECT_CATEGORY', { category: 'kids' }, 'Smile'),
 createButton('Beauty', 'SELECT_CATEGORY', { category: 'beauty' }, 'Sparkles'),
 createButton('Home', 'SELECT_CATEGORY', { category: 'home' }, 'Home'),
 backButton(),
 ];
 break;

 case 'PRODUCT_LIST':
 const products = await Product.find({ category: state.metadata.category }).limit(5).lean() as any[];
 if (products.length === 0) {
 responseText += `No products found in ${state.metadata.category}.`;
 } else {
 responseText += ` Top products in **${state.metadata.category}**:\n\n`;
 products.forEach((p, i) => {
 responseText += `${i+1}. **${p.title}** - ₹${p.price}\n`;
 });
 buttons = products.map((p) => createButton(`View ${p.title.substring(0,15)}...`, 'SELECT_PRODUCT', { productId: p._id.toString() }));
 }
 buttons.push(backButton());
 break;

 case 'PRODUCT_DETAILS':
 const product = await Product.findById(state.metadata.productId).lean() as any;
 if (!product) {
 responseText += "Product not found.";
 } else {
 responseText += `**${product.title}**\n Price: ₹${product.price}\n Category: ${product.category}\n\n${product.description || ''}`;
 
 let isInWishlist = false;
 if (userId) {
 const wList = await Wishlist.findOne({ userId }).lean();
 if (wList && wList.items && wList.items.some((i: any) => i.productId.toString() === state.metadata.productId)) {
 isInWishlist = true;
 }
 }
 
 buttons = [
 createButton('Add to Cart', 'ADD_TO_CART', {}, 'ShoppingCart'),
 isInWishlist 
 ? createButton('Remove from Wishlist', 'REMOVE_FROM_WISHLIST', {}, 'Trash2') 
 : createButton('Add to Wishlist', 'ADD_TO_WISHLIST', {}, 'Heart'),
 ];
 }
 buttons.push(backButton());
 break;

 case 'CART_VIEW':
 if (!userId) {
 responseText += "Please log in to view your cart.";
 buttons = [backButton()];
 break;
 }
 const cart = await Cart.findOne({ userId }).lean();
 if (!cart || !cart.items || cart.items.length === 0) {
 responseText += " Your cart is currently empty.";
 } else {
 responseText += `**Your Cart Summary**\nTotal items: ${cart.items.length}\n\n`;
 let subtotal = 0;
 cart.items.forEach((item: any) => {
 if (cart.selectedItems.includes(item.productId.toString())) {
 subtotal += item.price * item.quantity;
 }
 responseText += `• ${item.title} (x${item.quantity}) - ₹${item.price * item.quantity}\n`;
 buttons.push(createButton(`Edit ${item.title.substring(0, 15)}`, 'SELECT_CART_ITEM', { productId: item.productId.toString(), title: item.title }));
 });

 const calculateDiscounts = (st: number) => {
 let discountAmount = 0;
 if (st >= 5000) discountAmount = 500;
 else if (st >= 3000) discountAmount = 300;
 else if (st >= 2000) discountAmount = 150;
 else if (st >= 1000) discountAmount = 50;

 if (st >= 4000 && st < 5000) {
 const percentageDiscount = st * 0.1;
 if (percentageDiscount > discountAmount) {
 discountAmount = percentageDiscount;
 }
 }
 return discountAmount;
 };

 const discountAmount = calculateDiscounts(subtotal);
 const deliveryCharge = subtotal > 5000 ? 0 : (subtotal > 0 ? 99 : 0);
 const total = subtotal - discountAmount + deliveryCharge;

 responseText += `\n**Subtotal:** ₹${subtotal.toFixed(2)}\n**Discount:** -₹${discountAmount.toFixed(2)}\n**Delivery:** ₹${deliveryCharge.toFixed(2)}\n**Total:** ₹${total.toFixed(2)}\n`;

 buttons.push(createButton('Proceed to Checkout', 'CHECKOUT', {}, 'CreditCard'));
 buttons.push(createButton('Apply Promo', 'NAV_OFFERS', {}, 'Tag'));
 }
 buttons.push(backButton());
 break;

 case 'CART_ITEM_DETAILS':
 const cartLookup = await Cart.findOne({ userId }).lean();
 const item = cartLookup?.items.find((i: any) => i.productId.toString() === state.metadata.productId);
 if (!item) {
 responseText += "Item no longer in cart.";
 } else {
 responseText += `**Editing Item:**\n${item.title}\nQuantity: ${item.quantity}\nPrice: ₹${item.price * item.quantity}`;
 buttons = [
 createButton('Increase', 'INC_QTY', {}, 'Plus'),
 createButton('Decrease', 'DEC_QTY', {}, 'Minus'),
 createButton('Remove', 'REMOVE_ITEM', {}, 'Trash2'),
 ];
 }
 buttons.push(backButton());
 break;

 case 'CHECKOUT_VIEW':
 responseText += "**Checkout**\nThis bot currently helps with navigation. To finalize your payment securely, please click the Cart icon at the top of the webpage and complete the checkout process.";
 buttons = [backButton()];
 break;

 case 'ORDERS_VIEW':
 if (!userId) {
 responseText += "Please log in to view your orders.";
 buttons = [backButton()];
 break;
 }
 const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5).lean() as any[];
 if (orders.length === 0) {
 responseText += " You have no recent orders.";
 buttons.push(backButton());
 } else {
 responseText += "**Recent Orders:**\nPlease select an order from the list below:\n\n";
 orders.forEach(o => {
 const productNames = o.items.map((i: any) => i.title).join(', ');
 responseText += `• **#${o.orderId}**\n Products: ${productNames}\n Status: ${o.orderStatus.toUpperCase()}\n\n`;
 buttons.push(createButton(`Select #${o.orderId}`, 'SELECT_ORDER', { orderId: o.orderId }));
 });
 buttons.push(backButton());
 buttons.push(createButton('Main Menu', 'RESET', {}, 'Home'));
 }
 break;

 case 'ORDER_DETAILS':
 const order = await Order.findOne({ orderId: state.metadata.orderId, userId }).lean();
 if (!order) {
 responseText += "Order not found.";
 buttons.push(backButton());
 } else {
 const productNames = order.items.map((i: any) => i.title).join(', ');
 responseText += `**Order Details:**\n\n**ID:** #${order.orderId}\n**Products:** ${productNames}\n**Status:** ${order.orderStatus.toUpperCase()}\n**Total:** ₹${order.totalAmount}\n**Placed on:** ${new Date(order.createdAt).toLocaleDateString()}`;
 
 if (order.orderStatus === 'cancelled' && order.refundStatus && order.refundStatus !== 'none') {
 responseText += `\n**Refund Status:** ${order.refundStatus.toUpperCase()}`;
 }

 const isEligible = ['pending', 'processing', 'confirmed'].includes(order.orderStatus.toLowerCase());
 
 buttons.push(createButton('Track Order', 'TRACK_ORDER', {}, 'Truck'));
 if (isEligible) {
 buttons.push(createButton('Cancel Order', 'INITIATE_CANCEL', {}, 'X'));
 } else {
 responseText += "\n\n *This order cannot be cancelled because it is already shipped, delivered, or previously cancelled.*";
 }
 buttons.push(backButton());
 buttons.push(createButton('Main Menu', 'RESET', {}, 'Home'));
 }
 break;

 case 'CONFIRM_CANCEL':
 responseText += `**Are you sure you want to cancel Order #${state.metadata.orderId}?**\n\nThis action cannot be undone.`;
 buttons = [
 createButton('Yes, Cancel Order', 'CANCEL_ORDER_CONFIRMED', {}, 'Check'),
 createButton('No, Go Back', 'CANCEL_ABORT', {}, 'X'),
 ];
 break;

 case 'COMPLETED_CANCEL':
 responseText += `**Your order #${state.metadata.orderId} has been successfully cancelled.**\nRefund will be processed shortly (if applicable).`;
 buttons = [
 createButton('Back to Orders', 'NAV_ORDERS', {}, 'Package'),
 createButton('Main Menu', 'RESET', {}, 'Home'),
 ];
 break;

 case 'PROFILE_VIEW':
 if (!userId) {
 responseText += "Please log in to view your profile.";
 buttons = [backButton()];
 break;
 }
 const userDoc = await User.findById(userId).lean() as any;
 if (!userDoc) {
 responseText += "User profile not found.";
 buttons = [backButton()];
 } else {
 responseText += `**Your Profile**\n\n**Name:** ${userDoc.name}\n**Email:** ${userDoc.email}\n**Member Since:** ${new Date(userDoc.createdAt).toLocaleDateString()}\n`;
 buttons = [
 createButton('Address', 'MANAGE_ADDRESS', {}, 'Home'),
 backButton(),
 ];
 }
 break;

 case 'ADDRESS_VIEW':
 if (!userId) {
 responseText += "Please log in to view your address.";
 buttons = [backButton()];
 break;
 }
 const defaultAddress = await Address.findOne({ userId, isDefault: true }).lean() as any;
 if (!defaultAddress) {
 responseText += "**Your Address**\n\nYou don't have a default address saved yet. Please go to the Manage Addresses page on the web dashboard to add one securely.";
 } else {
 responseText += `**Your Default Address:**\n\n**${defaultAddress.fullName}**\n${defaultAddress.houseNumber}, ${defaultAddress.street}\n${defaultAddress.city}, ${defaultAddress.state} - ${defaultAddress.pincode}\n📞 ${defaultAddress.phoneNumber}\n\n*(To edit your address, please go to the Manage Addresses Page).*`;
 }
 buttons = [backButton()];
 break;

 case 'WISHLIST_VIEW':
 if (!userId) {
 responseText += "Please log in to view your wishlist.";
 buttons = [backButton()];
 break;
 }
 const wishlistLookup = await Wishlist.findOne({ userId }).lean();
 if (!wishlistLookup || !wishlistLookup.items || wishlistLookup.items.length === 0) {
 responseText += " Your wishlist is empty.";
 } else {
 responseText += "**Your Wishlist**\n\n";
 wishlistLookup.items.forEach((item: any) => {
 responseText += `• ${item.title} - ₹${item.price}\n`;
 buttons.push(createButton(`Select ${item.title.substring(0, 12)}`, 'SELECT_WISHLIST_ITEM', { productId: item.productId.toString() }));
 });
 }
 buttons.push(backButton());
 break;

 case 'WISHLIST_ITEM_DETAILS':
 responseText += " Options for your saved item:";
 buttons = [
 createButton('Move to Cart', 'MOVE_TO_CART', {}, 'ShoppingCart'),
 createButton('Remove', 'REMOVE_ITEM', {}, 'Trash2'),
 backButton()
 ];
 break;

 case 'OFFERS_VIEW':
 const promos = await PromoCode.find({ isActive: true }).limit(3).lean() as any[];
 if (promos.length === 0) {
 responseText += " No active offers currently.";
 } else {
 responseText += "**Available Promos:**\n\n";
 promos.forEach(p => {
 responseText += `• **${p.code}** : ${p.discountType === 'percentage' ? p.discountValue + '%' : '₹' + p.discountValue} off\n`;
 buttons.push(createButton(`Apply ${p.code}`, 'APPLY_PROMO', { code: p.code }));
 });
 }
 buttons.push(backButton());
 break;

 default:
 responseText += "I am not sure how to handle this step.";
 buttons = [backButton()];
 break;
 }

 return {
 response: responseText.trim(),
 buttons,
 data: { products: productsData },
 isAuthenticated: !!userId
 };
}