import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import PromoCode from '@/models/PromoCode';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Wishlist from '@/models/Wishlist';
import Review from '@/models/Review';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import User from '@/models/User';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define order status type
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user from auth token for personalized responses
    const token = (await cookies()).get('authToken')?.value;
    let userId = null;
    let user = null;
    
    if (token) {
      try {
        const decoded = await adminAuth.verifySessionCookie(token, true);
        user = await User.findOne({ email: decoded.email });
        if (user) {
          userId = user._id;
        }
      } catch (err) {
        console.log('User not authenticated');
      }
    }

    const lowerMessage = message.toLowerCase();
    
    // Search for products based on keywords
    const searchTerms: string[] = lowerMessage.split(' ');
    const productQuery: any = {};
    
    // Price range detection
    const priceMatch = message.match(/(?:under|below|less than|budget of|max)\s*₹?\s*(\d+)/i);
    if (priceMatch) {
      productQuery.price = { $lte: parseInt(priceMatch[1]) };
    }

    const priceRangeMatch = message.match(/(?:between|from)\s*₹?\s*(\d+)\s*(?:to|and)\s*₹?\s*(\d+)/i);
    if (priceRangeMatch) {
      const minPrice = parseInt(priceRangeMatch[1]);
      const maxPrice = parseInt(priceRangeMatch[2]);
      productQuery.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Category detection based on keywords
    const categoryKeywords: Record<string, string[]> = {
      men: ['men', 'male', 'man', 'gentleman', 'boy'],
      women: ['women', 'woman', 'female', 'lady', 'girl'],
      kids: ['kids', 'child', 'children', 'baby', 'toddler', 'infant'],
      beauty: ['beauty', 'makeup', 'cosmetic', 'skincare', 'haircare', 'fragrance', 'perfume'],
      home: ['home', 'furniture', 'decor', 'kitchen', 'electronics', 'gadget', 'book']
    };

    // Subcategory keywords mapping
    const subcategoryKeywords: Record<string, string[]> = {
      // Men subcategories
      'clothing': ['clothing', 'shirt', 't-shirt', 'jeans', 'pant', 'jacket', 'hoodie', 'sweater'],
      'footwear': ['shoe', 'footwear', 'sneaker', 'boot', 'sandal', 'loafer', 'slipper'],
      'sports': ['sports', 'gym', 'workout', 'training', 'athletic', 'sportswear'],
      'accessories': ['accessories', 'watch', 'belt', 'cap', 'hat', 'sunglass', 'wallet'],
      
      // Women subcategories
      'jewelery': ['jewelry', 'jewellery', 'necklace', 'earring', 'ring', 'bracelet'],
      
      // Kids subcategories
      'boys': ['boys', 'boy'],
      'girls': ['girls', 'girl'],
      'toys': ['toy', 'games', 'play', 'fun'],
      
      // Home subcategories
      'home decor': ['decor', 'decoration', 'vase', 'lamp', 'wall art'],
      'furnishing': ['furniture', 'sofa', 'chair', 'table', 'bed', 'mattress'],
      'kitchen': ['kitchen', 'cookware', 'utensil', 'appliance'],
      'groceries': ['grocery', 'food', 'snack', 'drink'],
      'electronics': ['electronic', 'laptop', 'phone', 'tv', 'camera', 'speaker'],
      'gadgets': ['gadget', 'smart', 'device'],
      'books': ['book', 'novel', 'reading'],
      
      // Beauty subcategories
      'makeup': ['makeup', 'lipstick', 'foundation', 'eyeshadow'],
      'skincare': ['skin', 'cream', 'lotion', 'moisturizer'],
      'haircare': ['hair', 'shampoo', 'conditioner'],
      'fragrance': ['fragrance', 'perfume', 'cologne']
    };

    // Check for category mentions
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        productQuery.category = category;
        break;
      }
    }

    // Check for subcategory mentions
    const matchedSubcategories: string[] = [];
    for (const [subcategory, keywords] of Object.entries(subcategoryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        matchedSubcategories.push(subcategory);
      }
    }

    // Build text search query
    const searchableTerms = searchTerms
      .filter(term => term.length > 2 && !['show', 'find', 'get', 'me', 'looking', 'for', 'want', 'need', 'under', 'below', 'less', 'than', 'between', 'from', 'to', 'and', 'please', 'can', 'you', 'tell'].includes(term));

    // Create search conditions
    const searchConditions: any[] = [];

    // Add subcategory matches if found
    if (matchedSubcategories.length > 0) {
      searchConditions.push({ subcategory: { $in: matchedSubcategories } });
    }

    // Add text search if there are searchable terms
    if (searchableTerms.length > 0) {
      const textSearch = searchableTerms.join(' ');
      searchConditions.push({
        $or: [
          { title: { $regex: textSearch, $options: 'i' } },
          { description: { $regex: textSearch, $options: 'i' } },
          { subcategory: { $regex: textSearch, $options: 'i' } },
        ]
      });
    }

    // Combine search conditions with OR
    if (searchConditions.length > 0) {
      productQuery.$or = searchConditions;
    }

    // Enhanced cart-related query detection
    const cartKeywords = [
      'cart', 'my cart', 'shopping cart', 'bag', 'my bag',
      'items in cart', 'cart items', 'remove from cart', 'add to cart',
      'cart total', 'checkout', 'proceed to checkout'
    ];
    
    const isCartQuery = cartKeywords.some(k => lowerMessage.includes(k));
    
    // Specific cart intent detection
    const isViewCart = lowerMessage.includes('show') || lowerMessage.includes('view') || lowerMessage.includes('what') || lowerMessage.includes('my cart');
    const isCartTotal = lowerMessage.includes('total') || lowerMessage.includes('price') || lowerMessage.includes('cost');
    const isCartCount = lowerMessage.includes('how many') || lowerMessage.includes('items in');
    const isCheckout = lowerMessage.includes('checkout') || lowerMessage.includes('buy now') || lowerMessage.includes('place order');

    // Wishlist-related query detection
    const wishlistKeywords = [
      'wishlist', 'my wishlist', 'favorites', 'saved items', 'save for later',
      'items in wishlist', 'wishlist items', 'remove from wishlist', 'add to wishlist',
      'wishlist total', 'favorite items', 'liked products', 'saved products'
    ];
    
    const isWishlistQuery = wishlistKeywords.some(k => lowerMessage.includes(k));
    
    // Specific wishlist intent detection
    const isViewWishlist = lowerMessage.includes('show') || lowerMessage.includes('view') || lowerMessage.includes('what') || lowerMessage.includes('my wishlist');
    const isWishlistTotal = lowerMessage.includes('total') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('value');
    const isWishlistCount = lowerMessage.includes('how many') || lowerMessage.includes('items in');
    const isMoveToCart = lowerMessage.includes('move to cart') || lowerMessage.includes('add to cart from wishlist');

    // Order-related query detection
    const orderKeywords = [
      'order', 'orders', 'track', 'delivery', 'shipping', 'return', 'cancel',
      'my order', 'order status', 'where is my order', 'order details',
      'refund', 'exchange', 'replacement', 'delivered', 'shipped'
    ];
    
    const isOrderQuery = orderKeywords.some(k => lowerMessage.includes(k));
    
    // Specific order intent detection
    const isTrackOrder = lowerMessage.includes('track') || lowerMessage.includes('where is') || lowerMessage.includes('status');
    const isCancelOrder = lowerMessage.includes('cancel') || lowerMessage.includes('cancellation');
    const isReturnOrder = lowerMessage.includes('return') || lowerMessage.includes('exchange') || lowerMessage.includes('replacement');
    const isDeliveryTime = lowerMessage.includes('delivery time') || lowerMessage.includes('when will') || lowerMessage.includes('how long');
    const isShippingInfo = lowerMessage.includes('shipping') || lowerMessage.includes('delivery address');

    // Review-related query detection
    const reviewKeywords = [
      'review', 'reviews', 'rating', 'ratings', 'feedback', 'testimonial',
      'product review', 'customer review', 'read reviews', 'see reviews',
      'write a review', 'leave a review', 'my reviews', 'my feedback',
      'top rated', 'best rated', 'highest rated', '5 star', '4 star',
      'what people say', 'customer feedback', 'user reviews'
    ];
    
    const isReviewQuery = reviewKeywords.some(k => lowerMessage.includes(k));
    
    // Specific review intent detection
    const isViewReviews = lowerMessage.includes('show') || lowerMessage.includes('view') || lowerMessage.includes('read') || lowerMessage.includes('see');
    const isWriteReview = lowerMessage.includes('write') || lowerMessage.includes('leave') || lowerMessage.includes('post') || lowerMessage.includes('add');
    const isMyReviews = lowerMessage.includes('my reviews') || lowerMessage.includes('my feedback');
    const isTopRated = lowerMessage.includes('top rated') || lowerMessage.includes('best rated') || lowerMessage.includes('highest rated');
    const isRatingFilter = lowerMessage.includes('star') || lowerMessage.includes('rating');

    const isPromoQuery = ['promo', 'coupon', 'discount', 'offer', 'offers'].some(k => lowerMessage.includes(k));
    const isHelpQuery = ['help', 'what can you', 'how to', 'guide', 'what do you do'].some(k => lowerMessage.includes(k));
    const isGreeting = ['hi', 'hello', 'hey', 'hii', 'greetings'].some(k => lowerMessage.includes(k));

    let contextData: string = '';
    let products: any[] = [];
    let orderInfo: any = null;
    let recentOrders: any[] = [];
    let cartInfo: any = null;
    let wishlistInfo: any = null;
    let reviewInfo: any = null;
    let userReviews: any[] = [];
    let productReviews: any[] = [];

    // Fetch cart data if query is cart-related and user is logged in
    if (isCartQuery && userId) {
      const cart = await Cart.findOne({ userId }).lean();
      
      if (cart) {
        const cartItems = cart.items || [];
        const selectedItems = cart.selectedItems || [];
        
        // Calculate subtotal for selected items
        const subtotal = cartItems
          .filter((item: any) => selectedItems.includes(item.productId.toString()))
          .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        
        cartInfo = {
          totalItems: cartItems.length,
          selectedItemsCount: selectedItems.length,
          subtotal: subtotal,
          items: cartItems.slice(0, 5).map((item: any) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          })),
        };
      }
    }

    // Fetch wishlist data if query is wishlist-related and user is logged in
    if (isWishlistQuery && userId) {
      const wishlist = await Wishlist.findOne({ userId }).lean();
      
      if (wishlist) {
        const wishlistItems = wishlist.items || [];
        
        // Calculate total value
        const totalValue = wishlistItems.reduce((sum: number, item: any) => sum + item.price, 0);
        
        wishlistInfo = {
          totalItems: wishlistItems.length,
          totalValue: totalValue,
          items: wishlistItems.slice(0, 5).map((item: any) => ({
            title: item.title,
            price: item.price,
            category: item.category,
            addedAt: item.addedAt,
          })),
        };
      }
    }

    // Fetch review data based on query type
    if (isReviewQuery) {
      if (isMyReviews && userId) {
        // Get user's own reviews
        userReviews = await Review.find({ userId })
          .sort({ createdAt: -1 })
          .populate('productId', 'title image')
          .limit(5)
          .lean();
        
        if (userReviews.length > 0) {
          reviewInfo = {
            type: 'user',
            totalReviews: userReviews.length,
            averageRating: userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length,
            reviews: userReviews.map((r: any) => ({
              productName: r.productId?.title || 'Product',
              rating: r.rating,
              comment: r.comment.substring(0, 100) + (r.comment.length > 100 ? '...' : ''),
              date: r.createdAt,
            })),
          };
        }
      } else if (isTopRated) {
        // Get top-rated products
        const topRatedProducts = await Review.aggregate([
          {
            $group: {
              _id: '$productId',
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 }
            }
          },
          { $match: { reviewCount: { $gte: 2 } } },
          { $sort: { averageRating: -1, reviewCount: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' }
        ]);

        if (topRatedProducts.length > 0) {
          reviewInfo = {
            type: 'topRated',
            products: topRatedProducts.map((p: any) => ({
              title: p.product.title,
              averageRating: p.averageRating.toFixed(1),
              reviewCount: p.reviewCount,
              price: p.product.price,
            })),
          };
        }
      } else {
        // Try to extract product name from message for specific product reviews
        const potentialProductName = searchableTerms.join(' ');
        if (potentialProductName) {
          const product = await Product.findOne({
            $or: [
              { title: { $regex: potentialProductName, $options: 'i' } },
              { description: { $regex: potentialProductName, $options: 'i' } }
            ]
          }).lean();

          if (product) {
            productReviews = await Review.find({ productId: product._id })
              .sort({ createdAt: -1 })
              .limit(5)
              .lean();

            if (productReviews.length > 0) {
              const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
              const ratingCounts = [1,2,3,4,5].map(star => ({
                star,
                count: productReviews.filter(r => r.rating === star).length
              }));

              reviewInfo = {
                type: 'product',
                productName: product.title,
                totalReviews: productReviews.length,
                averageRating: averageRating.toFixed(1),
                ratingDistribution: ratingCounts,
                reviews: productReviews.map((r: any) => ({
                  userName: r.userName,
                  rating: r.rating,
                  comment: r.comment,
                  date: r.createdAt,
                })),
              };
            }
          }
        }
      }
    }

    // Fetch relevant data based on query type
    if (isCartQuery) {
      // Build cart-related context
      if (!userId) {
        contextData = 'Please log in to your account to view your cart.';
      } else if (!cartInfo || cartInfo.totalItems === 0) {
        contextData = 'Your cart is empty. Start shopping to add items to your cart!';
      } else {
        contextData = `You have ${cartInfo.totalItems} items in your cart (${cartInfo.selectedItemsCount} selected).\n`;
        contextData += `Subtotal for selected items: ₹${cartInfo.subtotal}\n\n`;
        contextData += 'Items in your cart:\n' + 
          cartInfo.items.map((item: any, i: number) => 
            `• ${item.title} - ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}`
          ).join('\n');
        
        if (cartInfo.totalItems > 5) {
          contextData += `\n• ... and ${cartInfo.totalItems - 5} more items`;
        }

        // Add specific cart information based on intent
        if (isCartTotal) {
          contextData += `\n\n💰 Your cart subtotal is ₹${cartInfo.subtotal}. Free shipping on orders above ₹5,000!`;
        }
        if (isCartCount) {
          contextData += `\n\n🛒 You have ${cartInfo.totalItems} items in your cart.`;
        }
        if (isCheckout) {
          contextData += `\n\n🛍️ Proceed to checkout to complete your purchase. You can review your order before placing it.`;
        }
      }
    } else if (isWishlistQuery) {
      // Build wishlist-related context
      if (!userId) {
        contextData = 'Please log in to your account to view your wishlist.';
      } else if (!wishlistInfo || wishlistInfo.totalItems === 0) {
        contextData = 'Your wishlist is empty. Browse products and save your favorites!';
      } else {
        contextData = `You have ${wishlistInfo.totalItems} items in your wishlist.\n`;
        contextData += `Total wishlist value: ₹${wishlistInfo.totalValue}\n\n`;
        contextData += 'Items in your wishlist:\n' + 
          wishlistInfo.items.map((item: any, i: number) => 
            `• ${item.title} - ₹${item.price} (${item.category})\n  Added: ${new Date(item.addedAt).toLocaleDateString()}`
          ).join('\n\n');
        
        if (wishlistInfo.totalItems > 5) {
          contextData += `\n\n• ... and ${wishlistInfo.totalItems - 5} more items`;
        }

        // Add specific wishlist information based on intent
        if (isWishlistTotal) {
          contextData += `\n\n💰 Your wishlist total value is ₹${wishlistInfo.totalValue}.`;
        }
        if (isWishlistCount) {
          contextData += `\n\n❤️ You have ${wishlistInfo.totalItems} items in your wishlist.`;
        }
        if (isMoveToCart) {
          contextData += `\n\n🛒 You can move items from your wishlist to cart when you're ready to purchase.`;
        }
      }
    } else if (isReviewQuery) {
      // Build review-related context
      if (isMyReviews && !userId) {
        contextData = 'Please log in to your account to view your reviews.';
      } else if (isMyReviews && (!userReviews || userReviews.length === 0)) {
        contextData = "You haven't written any reviews yet. After purchasing products, you can share your experience!";
      } else if (isMyReviews && reviewInfo) {
        contextData = `You have written ${reviewInfo.totalReviews} reviews with an average rating of ${reviewInfo.averageRating.toFixed(1)} ⭐.\n\n`;
        contextData += 'Your recent reviews:\n' + 
          reviewInfo.reviews.map((r: any) => 
            `• ${r.productName}: ${'⭐'.repeat(r.rating)} - "${r.comment}"`
          ).join('\n');
      } else if (isTopRated && reviewInfo) {
        contextData = '🏆 **Top Rated Products**\n\n' + 
          reviewInfo.products.map((p: any, i: number) => 
            `${i+1}. **${p.title}** - ${p.averageRating} ⭐ (${p.reviewCount} reviews) - ₹${p.price}`
          ).join('\n');
      } else if (reviewInfo && reviewInfo.type === 'product') {
        contextData = `📊 **Reviews for ${reviewInfo.productName}**\n\n`;
        contextData += `Average Rating: ${reviewInfo.averageRating} ⭐ (${reviewInfo.totalReviews} reviews)\n\n`;
        contextData += 'Rating Distribution:\n' + 
          reviewInfo.ratingDistribution.map((r: any) => 
            `• ${r.star} ⭐: ${r.count} reviews`
          ).join('\n');
        contextData += '\n\n**Recent Reviews:**\n' + 
          reviewInfo.reviews.map((r: any) => 
            `• ${r.userName}: ${'⭐'.repeat(r.rating)} - "${r.comment}"\n  📅 ${new Date(r.date).toLocaleDateString()}`
          ).join('\n\n');
      } else {
        contextData = 'I can help you with reviews! You can:\n';
        contextData += '• View reviews for a specific product (e.g., "show reviews for Nike shoes")\n';
        contextData += '• Check your own reviews (e.g., "my reviews")\n';
        contextData += '• See top-rated products (e.g., "top rated products")\n';
        contextData += '• Learn how to write a review';
      }
    } else if (isOrderQuery && userId) {
      // Get user's recent orders
      recentOrders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (recentOrders.length > 0) {
        orderInfo = recentOrders.map((order: any) => ({
          orderId: order.orderId,
          status: order.orderStatus,
          amount: order.totalAmount,
          date: order.createdAt,
          items: order.items.length,
        }));
      }

      // Build order-related context
      if (!userId) {
        contextData = 'Please log in to your account to view order details.';
      } else if (recentOrders.length === 0) {
        contextData = 'You haven\'t placed any orders yet. Start shopping to see your orders here!';
      } else {
        // Create order summary
        const statusCounts = recentOrders.reduce((acc: any, order: any) => {
          acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
          return acc;
        }, {});

        const orderSummary = Object.entries(statusCounts)
          .map(([status, count]) => `${count} ${status}`)
          .join(', ');

        contextData = `You have ${recentOrders.length} recent orders (${orderSummary}).\n\n`;
        contextData += 'Recent orders:\n' + recentOrders.map((order: any, i: number) => 
          `• Order #${order.orderId}: ${order.orderStatus} - ₹${order.totalAmount} (${new Date(order.createdAt).toLocaleDateString()})`
        ).join('\n');
      }

      // Add general order information
      contextData += '\n\n📦 General Order Information:\n';
      contextData += '• Delivery typically takes 3-5 business days\n';
      contextData += '• Free shipping on orders above ₹5,000\n';
      contextData += '• 7-day easy returns available\n';
      contextData += '• You can track orders in the Orders section of your account\n';
      
      if (isTrackOrder) {
        contextData += '\n📍 To track a specific order, please log in and visit the Orders section.';
      }
      if (isCancelOrder) {
        contextData += '\n❌ Orders can be cancelled within 24 hours of placement if not yet shipped.';
      }
      if (isReturnOrder) {
        contextData += '\n🔄 Returns are accepted within 7 days of delivery. Items must be unused and in original packaging.';
      }
      if (isDeliveryTime) {
        contextData += '\n⏱️ Standard delivery: 3-5 business days. Express delivery available at checkout.';
      }
      if (isShippingInfo) {
        contextData += '\n🏠 Shipping addresses can be managed in your profile before placing an order.';
      }

    } else if (isPromoQuery) {
      const promos = await PromoCode.find({
        isActive: true,
        startDate: { $lte: new Date() },
        expiryDate: { $gt: new Date() },
      }).limit(5).lean();

      if (promos.length > 0) {
        contextData = 'Available promo codes:\n' + promos.map((p: any) => 
          `• ${p.code}: ${p.discountType === 'percentage' ? p.discountValue + '%' : '₹' + p.discountValue} off (Min order: ₹${p.minOrderAmount})`
        ).join('\n');
      } else {
        contextData = 'There are no active promo codes at the moment.';
      }
    } else if (!isGreeting && !isHelpQuery) {
      // Search for products
      console.log('Search query:', JSON.stringify(productQuery, null, 2));
      
      products = await Product.find(productQuery)
        .sort({ isTrending: -1, isNewArrival: -1, createdAt: -1 })
        .limit(8)
        .lean();

      console.log(`Found ${products.length} products`);

      if (products.length > 0) {
        // Get review counts and ratings for these products
        const productIds = products.map(p => p._id);
        const reviewStats = await Review.aggregate([
          { $match: { productId: { $in: productIds } } },
          {
            $group: {
              _id: '$productId',
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 }
            }
          }
        ]);

        // Create a map of review stats
        const reviewMap = new Map();
        reviewStats.forEach(stat => {
          reviewMap.set(stat._id.toString(), {
            rating: stat.averageRating.toFixed(1),
            count: stat.reviewCount
          });
        });

        contextData = 'Here are some products that might interest you:\n' + 
          products.map((p: any) => {
            const reviews = reviewMap.get(p._id.toString());
            const reviewText = reviews ? ` (${reviews.rating}⭐ from ${reviews.count} reviews)` : '';
            return `• ${p.title} - ₹${p.price}${reviewText} (${p.category} - ${p.subcategory})`;
          }).join('\n');
      } else {
        // If no products found, try a more lenient search
        const lenientQuery: any = {};
        
        // Keep price filters if they exist
        if (productQuery.price) {
          lenientQuery.price = productQuery.price;
        }
        
        // Try to find any products in the same category or with similar keywords
        if (productQuery.category) {
          lenientQuery.category = productQuery.category;
        }
        
        products = await Product.find(lenientQuery)
          .sort({ isTrending: -1, createdAt: -1 })
          .limit(5)
          .lean();
        
        if (products.length > 0) {
          contextData = 'I couldn\'t find exact matches, but here are some products you might like:\n' + 
            products.map((p: any) => 
              `• ${p.title} - ₹${p.price} (${p.category} - ${p.subcategory})`
            ).join('\n');
        }
      }
    }

    // Prepare the prompt for Gemini
    let prompt = '';
    
    if (isGreeting) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user greeted you. Respond with a warm, friendly welcome message and ask how you can help them today.`;
    } else if (isHelpQuery) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user is asking for help. Respond with a friendly message explaining what you can do.
Keep it concise and welcoming.`;
    } else if (isCartQuery && contextData) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked about their cart. Here's the relevant cart information:
${contextData}

Provide a helpful, personalized response about their cart. If they're logged in, show their cart items.
If they're not logged in, politely ask them to log in.
Use emojis and be conversational.`;
    } else if (isWishlistQuery && contextData) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked about their wishlist. Here's the relevant wishlist information:
${contextData}

Provide a helpful, personalized response about their wishlist. If they're logged in, show their wishlist items.
If they're not logged in, politely ask them to log in.
Mention that they can move items to cart when ready to purchase.
Use emojis and be conversational.`;
    } else if (isReviewQuery && contextData) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked about reviews. Here's the relevant review information:
${contextData}

Provide a helpful, personalized response about reviews. If they're asking about their own reviews, show them.
If they're asking about product reviews, share the ratings and feedback.
If they want to write a review, guide them on how to do it.
Use emojis and be conversational.`;
    } else if (isOrderQuery && contextData) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked about orders. Here's the relevant order information:
${contextData}

Provide a helpful, personalized response about their orders. If they're logged in, include their recent orders.
If they're not logged in, politely ask them to log in.
Use emojis and be conversational.`;
    } else if (products.length > 0) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked: "${message}"

Here are some products from our database that match their query:
${contextData}

Please provide a friendly, helpful response recommending these products. 
Include rating information if available.
Format the response nicely with emojis and bullet points. 
Keep it under 150 words and be conversational.`;
    } else if (isPromoQuery && contextData) {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked about promo codes. Here are the active promo codes:
${contextData}

Please present these offers in an exciting, engaging way with emojis. 
Encourage the user to use them.`;
    } else {
      prompt = `You are a helpful AI shopping assistant for Flash Flow, an e-commerce store. 
The user asked: "${message}"

We couldn't find any products matching their exact query. 
Suggest they try different keywords like "shoes", "clothing", "electronics", etc., browse by category, or check our collections.
Be friendly and helpful.`;
    }

    let response: string;

    try {
      // Check if API key exists
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
      }

      // Use the correct model name
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      console.log('Sending prompt to Gemini with model: gemini-2.5-flash');
      const result = await model.generateContent(prompt);
      const geminiResponse = await result.response;
      response = geminiResponse.text();
      console.log('Gemini response received');
      
    } catch (aiError: any) {
      console.error('Gemini API Error:', aiError);
      
      // Enhanced fallback responses
      if (isCartQuery) {
        if (!userId) {
          response = `🛒 **Cart Information**\n\nPlease log in to your account to view your cart.\n\nYou can add items to your cart while shopping, and they'll be saved for later after logging in.\n\n👉 Click the profile icon to log in.`;
        } else if (!cartInfo || cartInfo.totalItems === 0) {
          response = `🛒 **Your Cart is Empty**\n\nYou haven't added any items to your cart yet.\n\nStart shopping to add items!\n\n👉 Browse our collections and find something you love!`;
        } else {
          // Format cart information nicely
          const itemList = cartInfo.items.map((item: any, i: number) => 
            `${i+1}. **${item.title}**\n   💰 ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n   📁 ${item.category}`
          ).join('\n\n');

          response = `🛒 **Your Shopping Cart**\n\n${itemList}\n\n`;

          if (cartInfo.totalItems > 5) {
            response += `\n📦 ... and ${cartInfo.totalItems - 5} more items\n`;
          }

          response += `\n💰 **Cart Summary**\n`;
          response += `• Total Items: ${cartInfo.totalItems}\n`;
          response += `• Selected Items: ${cartInfo.selectedItemsCount}\n`;
          response += `• Subtotal: ₹${cartInfo.subtotal}\n\n`;

          if (isCheckout) {
            response += `🛍️ Ready to checkout? Proceed to review your order!`;
          } else if (isCartTotal) {
            response += `💰 Your cart subtotal is ₹${cartInfo.subtotal}. Add more items to qualify for free shipping above ₹5,000!`;
          } else {
            response += `📝 You can select items, update quantities, or remove items from your cart.\n👉 Visit the Cart page to manage your items.`;
          }
        }
      } else if (isWishlistQuery) {
        if (!userId) {
          response = `❤️ **Wishlist Information**\n\nPlease log in to your account to view your wishlist.\n\nYou can save items to your wishlist while browsing, and they'll be available after logging in.\n\n👉 Click the profile icon to log in.`;
        } else if (!wishlistInfo || wishlistInfo.totalItems === 0) {
          response = `❤️ **Your Wishlist is Empty**\n\nYou haven't added any items to your wishlist yet.\n\nBrowse our products and click the heart icon to save your favorites!\n\n👉 Check out our latest collections!`;
        } else {
          // Format wishlist information nicely
          const itemList = wishlistInfo.items.map((item: any, i: number) => 
            `${i+1}. **${item.title}**\n   💰 ₹${item.price}\n   📁 ${item.category}\n   📅 Added: ${new Date(item.addedAt).toLocaleDateString()}`
          ).join('\n\n');

          response = `❤️ **Your Wishlist**\n\n${itemList}\n\n`;

          if (wishlistInfo.totalItems > 5) {
            response += `\n📦 ... and ${wishlistInfo.totalItems - 5} more items\n`;
          }

          response += `\n💰 **Wishlist Summary**\n`;
          response += `• Total Items: ${wishlistInfo.totalItems}\n`;
          response += `• Total Value: ₹${wishlistInfo.totalValue}\n\n`;

          if (isMoveToCart) {
            response += `🛒 Ready to purchase? You can move items from your wishlist to cart!\n👉 Visit your wishlist page to manage items.`;
          } else {
            response += `📝 When you're ready to buy, you can move items to your cart.\n👉 Visit your wishlist page to manage your saved items.`;
          }
        }
      } else if (isReviewQuery) {
        if (isMyReviews && !userId) {
          response = `📝 **Your Reviews**\n\nPlease log in to your account to view your reviews.\n\nAfter purchasing products, you can share your experience!\n\n👉 Click the profile icon to log in.`;
        } else if (isMyReviews && (!userReviews || userReviews.length === 0)) {
          response = `📝 **No Reviews Yet**\n\nYou haven't written any reviews.\n\nAfter receiving your orders, you can:\n• Share your experience\n• Rate products\n• Help other customers\n\n👉 Check your orders page to review purchased items!`;
        } else if (isMyReviews && reviewInfo) {
          response = `📝 **Your Reviews**\n\nYou've written ${reviewInfo.totalReviews} reviews with an average rating of ${reviewInfo.averageRating.toFixed(1)} ⭐\n\n`;
          response += reviewInfo.reviews.map((r: any) => 
            `• **${r.productName}**\n  ${'⭐'.repeat(r.rating)} - "${r.comment}"`
          ).join('\n\n');
        } else if (isTopRated && reviewInfo) {
          response = `🏆 **Top Rated Products**\n\n` + 
            reviewInfo.products.map((p: any, i: number) => 
              `${i+1}. **${p.title}**\n   ⭐ ${p.averageRating} (${p.reviewCount} reviews)\n   💰 ₹${p.price}`
            ).join('\n\n');
        } else if (reviewInfo && reviewInfo.type === 'product') {
          response = `📊 **Reviews for ${reviewInfo.productName}**\n\n`;
          response += `⭐ Average Rating: ${reviewInfo.averageRating}/5 (${reviewInfo.totalReviews} reviews)\n\n`;
          response += '**Rating Breakdown:**\n' + 
            reviewInfo.ratingDistribution.map((r: any) => 
              `• ${r.star} ⭐: ${r.count} ${r.count === 1 ? 'review' : 'reviews'}`
            ).join('\n');
          response += '\n\n**Recent Reviews:**\n' + 
            reviewInfo.reviews.map((r: any) => 
              `• **${r.userName}**: ${'⭐'.repeat(r.rating)}\n  "${r.comment}"`
            ).join('\n\n');
        } else {
          response = `📝 **Reviews Help**\n\nI can help you with:\n\n` +
            `• **Product Reviews** - "Show reviews for [product name]"\n` +
            `• **Your Reviews** - "My reviews" (login required)\n` +
            `• **Top Rated** - "Best rated products"\n` +
            `• **Write Review** - How to leave feedback\n\n` +
            `What would you like to know about reviews?`;
        }
      } else if (isOrderQuery) {
        if (!userId) {
          response = `🔐 **Order Information**\n\nPlease log in to your account to view your order details.\n\nYou can also track orders, check delivery status, and manage returns after logging in.\n\n👉 Click the profile icon to log in.`;
        } else if (recentOrders.length === 0) {
          response = `🛍️ **No Orders Yet**\n\nYou haven't placed any orders with us.\n\nStart shopping to see your orders here!\n\n👉 Browse our collections and find something you love!`;
        } else {
          // Define status emoji mapping with proper typing
          const statusEmojiMap: Record<OrderStatus, string> = {
            pending: '⏳',
            confirmed: '✅',
            processing: '🔄',
            shipped: '📦',
            delivered: '🎉',
            cancelled: '❌'
          };

          // Format order information nicely with type-safe status
          const orderList = recentOrders.map((order: any, i: number) => {
            const status = order.orderStatus as OrderStatus;
            const statusEmoji = statusEmojiMap[status] || '📋';
            
            return `${statusEmoji} **Order #${order.orderId}**\n   Status: ${order.orderStatus}\n   Amount: ₹${order.totalAmount}\n   Date: ${new Date(order.createdAt).toLocaleDateString()}`;
          }).join('\n\n');

          response = `📋 **Your Recent Orders**\n\n${orderList}\n\n`;

          if (isTrackOrder) {
            response += `\n📍 To track a specific order, please visit the Orders section in your account.`;
          } else if (isCancelOrder) {
            response += `\n❌ Orders can be cancelled within 24 hours if not yet shipped. Visit Orders section to cancel.`;
          } else if (isReturnOrder) {
            response += `\n🔄 Returns accepted within 7 days of delivery. Items must be unused.`;
          } else {
            response += `\n📦 Need help with a specific order? Let me know the order ID!`;
          }
        }
      } else if (products.length > 0) {
        response = `✨ **Products you might like**\n\n` + products.map((p: any, i: number) => {
          const reviewText = p.reviewCount ? `\n   ⭐ ${p.averageRating} (${p.reviewCount} reviews)` : '';
          return `${i+1}. **${p.title}** - ₹${p.price}${reviewText}\n   📁 ${p.category} - ${p.subcategory}`;
        }).join('\n\n') + `\n\n👉 Would you like to see reviews for any of these? You can also save them to your wishlist!`;
      } else if (isPromoQuery && contextData) {
        response = `🎉 **Available Offers**\n\n` + contextData.split('\n').map((line: string) => line.trim()).join('\n');
      } else if (isGreeting) {
        response = `👋 Hello! I'm your Flash Flow shopping assistant. How can I help you today? You can ask me about:\n• Products and recommendations\n• Shopping cart\n• Wishlist and saved items\n• Reviews and ratings\n• Order tracking and delivery\n• Promo codes and offers\n• Returns and exchanges`;
      } else if (isHelpQuery) {
        response = `🤖 **I can help you with:**\n\n` +
          `• **Products** - Find items, check prices, get recommendations\n` +
          `• **Reviews** - Read product reviews, check ratings, see top-rated items\n` +
          `• **Cart** - View cart, check totals, proceed to checkout\n` +
          `• **Wishlist** - View saved items, move to cart\n` +
          `• **Orders** - Track orders, check status, returns\n` +
          `• **Offers** - Promo codes, discounts, deals\n\n` +
          `What would you like to know?`;
      } else {
        response = `😕 I couldn't find products matching "${message}".\n\nTry:\n• Using simpler keywords like "shoes", "clothing", "electronics"\n• Checking different categories\n• Reading reviews for popular products\n• Browsing our collections from the homepage\n\nYou can also save items you like to your wishlist!`;
      }
    }

    return NextResponse.json({
      response,
      context: contextData,
      usingAI: true,
      isAuthenticated: !!userId,
      data: {
        ...(wishlistInfo && { wishlist: wishlistInfo }),
        ...(cartInfo && { cart: cartInfo }),
        ...(products.length > 0 && { products: products }),
        ...(recentOrders.length > 0 && { orders: recentOrders }),
        ...(reviewInfo && { reviews: reviewInfo }),
        ...(userReviews.length > 0 && { userReviews: userReviews }),
        ...(productReviews.length > 0 && { productReviews: productReviews })
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}