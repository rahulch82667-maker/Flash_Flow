import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategories = searchParams.getAll('subcategories');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build filter query
    const filter: any = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (subcategories.length > 0) {
      filter.subcategory = { $in: subcategories };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Build sort query
    let sort: any = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      default:
        sort = { createdAt: -1 }; // Default to newest
    }

    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    const formattedProducts = products.map(product => ({
      _id: product._id.toString(),
      title: product.title,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      subcategory: product.subcategory,
      isNewArrival: product.isNewArrival,
      isTrending: product.isTrending,
      createdAt: product.createdAt,
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error filtering products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}