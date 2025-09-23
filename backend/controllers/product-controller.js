// This product-controller provides separate handlers for admin and non-admin roles

import CustomError from '../error-handling/custom-error-class.js';
import ProductModel from '../models/product-model.js'; 
import controllerWrapper from '../utils/controller-wrapper.js'; 
import sendApiResponse from '../utils/api-response.js';
import { deleteCachedData, storeCachedData } from '../utils/cache-helpers.js';
import cacheKeyBuilders  from '../constants/cache-key-builders.js';

// search products 
export const searchProducts = controllerWrapper(async (req, res, next) => {
    const {value, skip, limit, sort } = req.sanitizedQuery;

    // search value is required
    if(!value){
      return next(new CustomError('BadRequestError', 'Search value is required', 400))
    }

    // search products based on the query
    const searchedProducts = await ProductModel.find({$text: {$search: value}})
    .sort(sort)
    .skip(skip)
    .limit(limit)

    if(searchedProducts.length === 0){
    return next(
      new CustomError('NotFoundError', 'No products match your search query.', 404))
    }

    const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
  // store products in cache(Redis)
    await storeCachedData(uniqueID, {data: searchedProducts}, 'product')
    sendApiResponse(res, 200, {
      data: searchedProducts,
   
  })
})

// create new product (accessible roles: Seller only)
export const createProduct = controllerWrapper(async (req, res, next) => {

  // body is empty
  if(Object.keys(req.body).length === 0)
    return new CustomError('BadRequestError', 
        `Please enter all required fields!`, 400)

  // if bulk creation limit exceeds
  const BULK_CREATION_LIMIT = 100;
  if(Array.isArray(req.body) && (req.body.length > BULK_CREATION_LIMIT)){
    return next(
      new CustomError('BadRequestError', 
        `Cannot create more than ${BULK_CREATION_LIMIT} products at once`, 400))
  }

  let productData;

  // for multiple products
  if(Array.isArray(req.body)){
    // adding seller ID and score to each product
    productData = req.body.map(product => ({
      ...product, 
      seller: req.user.id,  //current seller ID
      score: 0, // ensures user cannot set the score manually

      // createdAt is automatically set on creation and locked against modification
      createdAt: undefined  
    })
  )
  } else{

    // for a single product
    productData = { 
      ...req.body, 
      seller: req.user.id,  //current seller ID
      score: 0 // ensures user cannot set the score manually
    }
  }
  
  // creating product...
  const newProduct = await ProductModel.create(productData);

  //product created
  sendApiResponse(res, 201, {
    message: 'Product created successfully',
    data: newProduct
})
})

// get multiple products (public route)
export const getProducts = controllerWrapper(async (req, res, next) => {

  const {filter, sort, limit, skip, select } = req.sanitizedQuery;  

  const products = await ProductModel.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .select(select)
  .populate({
    //get also the seller of product
    path: 'seller', //a field of Product schema that stores user ID
    select: 'name -_id', //only include 'name' and exclude '_id'
    model: 'user' // name of the referenced model
  }); 

  if(products.length === 0){
    return next(new CustomError('NotFoundError', 'No products found', 404));
  }

  let uniqueID;

  //get unique ID ('<hash-of-query-string>')

  if(req.user?.roles.includes('admin'))
  uniqueID = cacheKeyBuilders.pvtResources(req.user.id, req.sanitizedQuery);

  else 
  uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
  
  // store products in cache(Redis)
  await storeCachedData(uniqueID, { data: products, ttl: 600 }, 'product');

  sendApiResponse(res, 200, {
    data: products,
    dataLength: products.length,
})
})

// get my products  (accessible roles: Seller only)
export const getMyProducts = controllerWrapper(async (req, res, next) => {
  const userID = req.user.id; //seller
  const {filter, sort, limit, skip, select } = req.sanitizedQuery; //filter  

  // getting seller products...
  
  
  const products = await ProductModel.find({...filter, seller: userID})
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .select(select); 

  if(products.length === 0){
    return next(new CustomError('NotFoundError', 'You have no products yet', 404));
  }

  // store products in cache(Redis)
  const uniqueID = cacheKeyBuilders.pvtResources(userID, req.sanitizedQuery);
  await storeCachedData(uniqueID, { data: products, ttl: 300 }, 'product');

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

  if(req.user?.roles.includes('admin'))
  uniqueID = cacheKeyBuilders.pvtResources(req.user.id, productID);

  else 
  uniqueID = cacheKeyBuilders.publicResources(productID);

  // store the product in cache(Redis)
  await storeCachedData(uniqueID, { data: product, ttl: 250 }, 'product');

  sendApiResponse(res, 200, {
    data: product,
})
});

// update product by ID (accessible roles: Seller only)
export const updateMyProductByID = controllerWrapper(async (req, res, next) => {
    // body is empty
  if(Object.keys(req.body).length === 0)
    return new CustomError('BadRequestError', 
        `Body is empty for updation!`, 400)


  const productID  = req.params.id; //product ID
  const updates = req.body; //changes to update
  const userID = req.user.id; //current seller

  const product = await ProductModel.findOne({_id: productID, seller: userID});

  // product not found
  if(!product){
    return next(new CustomError('NotFoundError', 'Product not found for updation', 404))
  }

   // assign updated fields
   Object.assign(product, {
    ...updates, 

    // ensure product's score and seller ID remain unchanged
    seller: userID, 
    score: product.score
  });

  // saving updated product
  await product.save()

  // invalidate the product
  const uniqueID = cacheKeyBuilders.pvtResources(userID, productID);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    message: 'Product updated successfully',
    data: product,
  })
})

// delete product by ID (accessible roles: Seller only)
export const deleteMyProductByID = controllerWrapper(async (req, res, next) => {
  const productID  = req.params.id; //product ID
  const userID = req.user.id; //current seller

  // deleting
  const deletedProduct = await ProductModel.findOneAndDelete({_id: productID, seller: userID});

  // product not found
  if(!deletedProduct){
    return next(new CustomError('NotFoundError', 'Product not found for deletion', 404))
  }

  // invalidate the product
  const uniqueID = cacheKeyBuilders.pvtResources(userID, productID);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    data: deletedProduct,
    message: 'Product deleted successfully',
})
})

// delete multiple products (accessible roles: Seller only)
export const deleteMyProducts = controllerWrapper(async (req, res, next) => {
  let {filter}  = req.sanitizedQuery; //filter
  const userID = req.user.id; //current seller

  // deleting
  const deletedProducts = await ProductModel.deleteMany({...filter, seller: userID});

  // product not found
  if(deletedProducts.deletedCount === 0){
    return next(new CustomError('NotFoundError', 'No products found for deletion', 404))
  }

  // invalidate products
  const uniqueID = cacheKeyBuilders.pvtResources(userID, req.sanitizedQuery);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    message: `Deleted ${deletedProducts.deletedCount} product(s) successfully`,
})
})

// update multiple products (accessible roles: Admin only)
export const adminUpdateProducts = controllerWrapper(async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return new CustomError('BadRequestError', 'Body is empty for updation!', 400);
  }

  const { filter, limit, skip } = req.sanitizedQuery; // which products to update
  const updates = req.body; //updates

  // products to update
  const productsToUpdate = await ProductModel.find(filter)
  .skip(skip)
  .limit(limit);

  // no products found
  if (productsToUpdate.length === 0) {
    return next(new CustomError('NotFoundError', 'No products found for update', 404));
  }

  // creating array of updates, per product
  const operations = productsToUpdate.map(product => ({
    updateOne: {
      filter: { _id: product._id }, 
      update: updates
    }
  }))

  // updating products in bulk
  const result = await ProductModel.bulkWrite(operations);
  
  // invalidate cached data
  const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    message: `Updated ${result.modifiedCount} product(s) successfully`,
  })

});

// delete multiple products (accessible roles: Admin only)
export const adminDeleteProducts = controllerWrapper(async (req, res, next) => {
  const { filter } = req.sanitizedQuery;

// products to delete
  const productsToDelete = await ProductModel.find(filter)
  .skip(skip)
  .limit(limit);

  // no products found
  if (productsToDelete.length === 0) {
    return next(new CustomError('NotFoundError', 'No products found for deletion', 404));
  }

  // creating array of filters(includes product ID) of products
  const operations = productsToDelete.map(product => ({
    deleteOne: {
      filter: { _id: product._id }, 
    }
  }))

  // deleting products in bulk
  const result = await ProductModel.bulkWrite(operations);
  
  // invalidate cached data
  const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    message: `Deleted ${result.deletedCount} product(s) successfully`,
  })

});

// update product by ID (accessible roles: Admin only)
export const adminUpdateProductByID = controllerWrapper(async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return new CustomError('BadRequestError', 'Body is empty for updation!', 400);
  }

  const productID = req.params.id;
  const updates = req.body;

  const product = await ProductModel.findById(productID);

  if (!product) {
    return next(new CustomError('NotFoundError', 'Product not found', 404));
  }


  Object.assign(product, {
    ...updates,

    // ensure product's score and seller ID remain unchanged
    seller: product.seller,
    score: product.score
  });

  // saving updated product
  await product.save();

  const uniqueID = cacheKeyBuilders.publicResources(productID);
  await storeCachedData(uniqueID, { data: product }, 'product', true);

  sendApiResponse(res, 200, {
    data: product, //updated product
    message: 'Product deleted successfully',
})
});

// delete product by ID (accessible roles: Admin only)
export const adminDeleteProductByID = controllerWrapper(async (req, res, next) => {
  const productID = req.params.id;

  const deletedProduct = await ProductModel.findByIdAndDelete(productID);

  if (!deletedProduct) {
    return next(new CustomError('NotFoundError', 'Product not found', 404));
  }

  const uniqueID = cacheKeyBuilders.publicResources(productID);
  await deleteCachedData(uniqueID, 'product');

  sendApiResponse(res, 200, {
    data: deletedProduct,
    message: 'Product deleted successfully',
})

});
