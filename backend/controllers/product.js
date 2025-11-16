// Public controllers 

import CustomError from '../error-handling/customError.js';
import ProductModel from '../models/product.js';
import controllerWrapper from '../utils/controllerWrapper.js';
import sendApiResponse from '../utils/apiResponse.js';
import { storeCachedData } from '../utils/helpers/cache.js';
import cacheKeyBuilders from '../constants/cacheKeyBuilders.js';
import mongoose from 'mongoose';

// search products 
export const searchProducts = controllerWrapper(async (req, res, next) => {
  const { value, skip, limit, sort } = req.sanitizedQuery || {};

  // search value is required
  if (!value) {
    return next(new CustomError('BadRequestError', 'Search value is required', 400))
  }

  // search products based on the query
  const searchedProducts = await ProductModel.find({ $text: { $search: value } })
    .sort(sort)
    .skip(skip)
    .limit(limit)

  const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
  // store products in cache(Redis)
  await storeCachedData(uniqueID, { data: searchedProducts }, 'product')
  sendApiResponse(res, 200, {
    data: searchedProducts,

  })
})

// get multiple products (public route)
export const getProducts = controllerWrapper(async (req, res, next) => {

  const { filter, sort, limit, skip } = req.sanitizedQuery || {};
  

const products = await ProductModel.aggregate([
  { 
    $match: { 
      ...filter,
      "warehouses.warehouse": req.nearbyWarehouse._id 
    } 
  },
  // get the products available in the nearby warehouse
  {
    $addFields: {
      matchedWarehouse: {
        $first: {
          $filter: {
            input: "$warehouses",
            as: "w",
            cond: { $eq: ["$$w.warehouse", req.nearbyWarehouse._id] }
          }
        }
      }
    }
  },

  // add the product quantity available in the warehouse
  {
    $addFields: {
      quantity: "$matchedWarehouse.quantity"
    }
  },
  {
    $project: {
      warehouses: 0,
      matchedWarehouse: 0,
      description: 0,
      score: 0,
      tags: 0,
      __v: 0,
      createdAt: 0,
    }
  },
  { $sort: sort || { score : -1 }},
  { $skip: skip || 0},
  { $limit: limit || 12}
]);

  let uniqueID;

  //get unique ID ('<hash-of-query-string>')
  if (products.length > 0) {
    if (req.user?.roles.includes('admin'))
      uniqueID = cacheKeyBuilders.pvtResources(req.user.id, req.sanitizedQuery);

    else
      uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);

    // store products in cache(Redis)
    await storeCachedData(uniqueID, { data: products, ttl: 600 }, 'product');
  }


  sendApiResponse(res, 200, {
    data: products,
    dataLength: products.length,
  })
})


// get single product by ID (public route)
export const getProductByID = controllerWrapper(async (req, res, next) => {
  const productID = req.params.id;

  const product = await ProductModel.aggregate([
    { 
      $match: { 
      _id: new mongoose.Types.ObjectId(productID), 
      "warehouses.warehouse": req.nearbyWarehouse._id
    } 
  },
  {
    $addFields: {
      matchedWarehouse: {
        $first: {
          $filter: {
            input: "$warehouses",
            as: "w",
            cond: { $eq: ["$$w.warehouse", req.nearbyWarehouse._id] }
          }
        }
      }
    }
  },
  {
    $addFields: {
      quantity: "$matchedWarehouse.quantity"
    }
  },
  {
    $project: {
      warehouses: 0,
      matchedWarehouse: 0,
      __v: 0,
      createdAt: 0,
    }
  }
  ])

  // product not found
  if (product.length === 0) {
    return next(new CustomError('NotFoundError', 'Product not found', 404));
  }
  //get unique ID ('<hash-of-query-string>')

  let uniqueID;

  if (req.user?.roles.includes('admin'))
    uniqueID = cacheKeyBuilders.pvtResources(req.user.id, productID);

  else
    uniqueID = cacheKeyBuilders.publicResources(productID);

  // store the product in cache(Redis)
  await storeCachedData(uniqueID, { data: product, ttl: 250 }, 'product');

  sendApiResponse(res, 200, {
    data: product[0],
  })
});