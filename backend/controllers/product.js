// Public controllers 

import CustomError from '../error-handling/customError.js';
import ProductModel from '../models/product.js';
import controllerWrapper from '../utils/controllerWrapper.js';
import sendApiResponse from '../utils/apiResponse.js';
import { storeCachedData } from '../utils/helpers/cache.js';
import mongoose from 'mongoose';

// search products 
export const searchProducts = controllerWrapper(async (req, res, next) => {
  const { value, filter, skip, limit, sort, select } = req.sanitizedQuery || {};

  // search value is required
  if (!value) {
    return next(new CustomError('BadRequestError', 'Search value is required', 400))
  }

  // search products based on the query
  const searchedProducts = await ProductModel.aggregate([
    {
      $match: {
        ...filter,
        "warehouses.warehouse": req.nearbyWarehouse._id,
        $text: { $search: value }
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
    // default sort by relevance (here, we sort by quantity descending)
    { $sort: {...sort, quantity: sort.quantity || -1}},

    { $skip: skip || 0 },
    { $limit: limit || 12 },

    // projection
    {
      $project: select ? select : {
        warehouses: 0,
        matchedWarehouse: 0,
        score: 0,
        __v: 0,
      }
    },
  ]);

  if (searchedProducts.length > 0 && req.redisCacheKey) {
    // store products in cache(Redis)
    await storeCachedData(req.redisCacheKey, { data: searchedProducts }, 'product')
  }


  sendApiResponse(res, 200, {
    data: searchedProducts,

  })
})

// get multiple products (public route)
export const getProducts = controllerWrapper(async (req, res, next) => {

  const { filter, sort, limit, skip, select } = req.sanitizedQuery || {};

  let quantity;

  // handle query for quantity
  if(filter.quantity){
    quantity = filter.quantity;
    delete filter.quantity; //remove from the original filter (because its not a direct field in product)
  } 
  else{
    quantity = { $gt: -1 } //default
  }
  
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

  // quantity available in the warehouse 
  {
    $match: { quantity }
  },
  
  // default sort by quantity descending
  { $sort: {...sort, quantity: sort.quantity || -1}},

  { $skip: skip || 0},
  { $limit: limit || 12},

  // projection
  {
    $project: select? select : {
      warehouses: 0,
      matchedWarehouse: 0,
      tags: 0,
      score: 0,
      __v: 0,
    }
  },
]);

  if (products.length > 0 && req.redisCacheKey) {

    // store products in cache(Redis)
    await storeCachedData(req.redisCacheKey, { data: products, ttl: 600 }, 'product');
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
      tags: 0,
      score: 0,
      __v: 0,
    }
  }
  ])

  // product not found
  if (product.length === 0) {
    return next(new CustomError('NotFoundError', 'Product not found', 404));
  }

  // store the product in cache(Redis)
  if (req.redisCacheKey)
  await storeCachedData(req.redisCacheKey, { data: product, ttl: 250 }, 'product');

  sendApiResponse(res, 200, {
    data: product[0],
  })
});