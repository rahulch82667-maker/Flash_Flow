import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const filter: any = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const [minResult, maxResult] = await Promise.all([
      Product.find(filter).sort({ price: 1 }).limit(1).lean(),
      Product.find(filter).sort({ price: -1 }).limit(1).lean(),
    ]);

    const minPrice = minResult.length > 0 ? minResult[0].price : 0;
    const maxPrice = maxResult.length > 0 ? maxResult[0].price : 100000;

    return NextResponse.json({
      minPrice,
      maxPrice,
    });
  } catch (error) {
    console.error('Error fetching price range:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}