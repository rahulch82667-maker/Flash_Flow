import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy");

    const limit = parseInt(searchParams.get("limit") || "12");
    const page = parseInt(searchParams.get("page") || "1");

    const skip = (page - 1) * limit;

    let filter: any = {};
    let isSpecificProductSearch = false;

    // Search query specific bypass logic
    if (q) {
      const escapedQ = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const exactTitleQuery = { title: { $regex: `^${escapedQ}$`, $options: "i" } };
      
      const exactCount = await Product.countDocuments(exactTitleQuery);
      if (exactCount === 1) {
         filter = exactTitleQuery;
         isSpecificProductSearch = true;
      } else {
        const qFilter = {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
            { subcategory: { $regex: q, $options: "i" } }
          ]
        };
        const broadCount = await Product.countDocuments(qFilter);
        if (broadCount === 1) {
           filter = qFilter;
           isSpecificProductSearch = true;
        } else {
           filter.$or = qFilter.$or;
        }
      }
    }

    // Category / Attribute filters apply normally only on array searches
    if (!isSpecificProductSearch) {
      if (category && category !== "all") {
        filter.category = category;
      }
      if (subcategory) {
        filter.subcategory = subcategory;
      }

      // Price bounds
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
    }
    
    let sortOptions: any = { createdAt: -1 };
    if (sortBy === "price-low") sortOptions = { price: 1 };
    else if (sortBy === "price-high") sortOptions = { price: -1 };
    else if (sortBy === "newest") sortOptions = { createdAt: -1 };

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(); 

    const transformedProducts = products.map((product: any) => ({
      ...product,
      id: product._id.toString(),
      isNew: product.isNewArrival || false,
      isTrending: product.isTrending || false,
    }));

    const total = await Product.countDocuments(filter);

    return NextResponse.json({
      products: transformedProducts,
      isSpecificProduct: isSpecificProductSearch,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
