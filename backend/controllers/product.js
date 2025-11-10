// Public controllers 

import CustomError from '../error-handling/customError.js';
import ProductModel from '../models/product.js';
import controllerWrapper from '../utils/controllerWrapper.js';
import sendApiResponse from '../utils/apiResponse.js';
import { storeCachedData } from '../utils/helpers/cache.js';
import cacheKeyBuilders from '../constants/cacheKeyBuilders.js';

// search products 
export const searchProducts = controllerWrapper(async (req, res, next) => {
  const { value, skip, limit, sort } = req.sanitizedQuery;

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

  const { filter, sort, limit, skip, select } = req.sanitizedQuery;

  const products = await ProductModel.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(select)
    .populate({
      //get also the seller of product
      path: 'warehouses.warehouse', //a field of Product schema that stores user ID
      select: 'name -_id', //only include 'name' and exclude '_id'
      model: 'user' // name of the referenced model
    });

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

  const product = await ProductModel.findById(productID)
    .populate({
      //get also the seller of product
      path: 'seller', //a field of Product schema that stores user ID
      select: 'name -_id', //only include 'name' and exclude '_id'
      model: 'user' // name of the referenced model
    });

  // product not found
  if (!product) {
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
    data: product,
  })
});