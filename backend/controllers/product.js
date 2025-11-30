// Public controllers 

import CustomError from '../error-handling/customError.js';
import sendApiResponse from '../utils/apiResponse.js';
import { storeCachedData } from '../utils/helpers/cache.js';
import mongoose from 'mongoose';
import OrderModel from './../models/order.js'
import { getProductsAgg } from '../utils/queries/product.js';

// search products 
export const searchProducts = async (req, res, next) => {
  const { value, filter, skip, limit, sort, select } = req.sanitizedQuery || {};

  // search value is required
  if (!value) {
    return next(new CustomError('BadRequestError', 'Search value is required', 400))
  }

  // search products based on the query
  const searchedProducts = await getProductsAgg({
    filter: {...filter, $text: { $search: value }},
    sort: sort,
    select: select,
    skip: skip,
    limit: limit,
    select: select

  }, req.nearbyWarehouse)

  if (searchedProducts.length > 0 && req.redisCacheKey) {
    // store products in cache(Redis)
    await storeCachedData(req.redisCacheKey, { data: searchedProducts }, 'product')
  }


  sendApiResponse(res, 200, {
    data: searchedProducts,
  })
}

// get multiple products (public route)
export const getProducts = async (req, res, next) => {

  const { filter, sort, limit, skip, select } = req.sanitizedQuery || {};

  const products = await getProductsAgg({
    filter: filter,
    sort: sort,
    select: select,
    skip: skip,
    limit: limit,
    select: select

  }, req.nearbyWarehouse)

    if (products.length > 0 && req.redisCacheKey) {

    // store products in cache(Redis)
    await storeCachedData(req.redisCacheKey, { data: products, ttl: 600 }, 'product');
  }


  sendApiResponse(res, 200, {
    data: products,
    dataLength: products.length,
  })
}

// get single product by ID (public route)
export const getProductByID = async (req, res, next) => {
  const productID = req.params.id;

  const product = await getProductsAgg({
    filter:{ _id: new mongoose.Types.ObjectId(productID)},

  }, req.nearbyWarehouse)

  // product not found
  if (product.length === 0) {
    return next(new CustomError('NotFoundError', 'Product not found', 404));
  }

  // store the product in cache(Redis)
  if (req.redisCacheKey)
  await storeCachedData(req.redisCacheKey, { data: product[0], ttl: 250 }, 'product');

  sendApiResponse(res, 200, {
    data: product[0],
  })
}

// products top 20 recommendations based on order history 
export const productsRecommendations = async (req, res, next) => {

  const { sort, select } = req.sanitizedQuery

  const recentOrders = await OrderModel.aggregate([
    {
      $match: {
        // delivered orders in the last 45 days
        user: req.user._id,
        orderStatus: 'delivered',
        createdAt: { $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45 ) }
    }
    },  
    {
      $unwind: '$products'
    },

    // get products
    {
      $lookup: {
        from: 'products',
        localField: 'products.product',
        foreignField: '_id',
        as: 'orderedRecently'
      }
    },
      
    {
      $unwind: '$orderedRecently'
    },
  
    // group by categories and add recently purchased products
    {
      $group: {
        _id: '$orderedRecently.category', purchasedProds: { $push: '$orderedRecently',} }
    },

    {
      $project:  {  
        _id: 0,
        category: '$_id',
        purchasedProds: 1,
      }
    }
  ])

  // No recent orders found
  if(recentOrders.length === 0)
    return sendApiResponse(res, 200, {
    data: [],
    message: "Recommendations exist only when the user has order history." 
  })

  // get categories of which the user purchased products
  const purchasedCategories = recentOrders.map(o => o.category)
  
  // returns an array of products for exclusion (recently purchased)
  const purchasedProds = recentOrders.flatMap(o => o.purchasedProds)

  let recommededProds = await getProductsAgg({
    filter: {
      category: { $in: purchasedCategories }
    },
    sort: sort,
    select: select,
    limit: 20 //enfore limit to 20 for recommendations

  }, req.nearbyWarehouse)

  // IDs set
  const purchasedIDs = new Set(purchasedProds.map(prod => prod._id.toString()));

  // add recently purchased products
  let finalPurchasedProds = [];

  recommededProds.forEach(p => {

    if (purchasedIDs.has(p._id.toString()))
      finalPurchasedProds.push({ ...p, recentlyPurchased: true })

  })

  // remove the purchased products from recommended prods
  recommededProds = recommededProds.filter(p => !purchasedIDs.has(p._id.toString()))

  // keep the purchased products at the end of list
  recommededProds.push(...finalPurchasedProds)
  
  return sendApiResponse(res, 200, {
    data: recommededProds,
  })
}
