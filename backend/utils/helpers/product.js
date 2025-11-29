// operations for product management

import mongoose from "mongoose";
import ProductModel from "../../models/product.js";
import CustomError from "../../error-handling/customError.js";

// updates products after successful delivery
export const updateProductsOnDelivery = async products => {
    await ProductModel.updateMany(
        // product IDs
        { _id: { $in: products.map(p => p.product) } },
        {
            // increase score
            $inc: {
                score: 1,
            },
            byAdmin: true,
        }
    );
};

// updates cancelled products
export const updateProductsOnCancellation = async (products, nearbyWarehouse) => {
    const operations = products.map(item => ({
        updateOne: {
            filter: { 
              _id: new mongoose.Types.ObjectId(item.product._id),
              warehouses: {
                $elemMatch: {
                  warehouse: new mongoose.Types.ObjectId(nearbyWarehouse._id),
                }
              }
            },
            update: {

                $inc: {
                    'warehouses.$.quantity': item.quantity,
                    byAdmin: true
                }
            }
        }
    }));

    // run updation...
    await ProductModel.bulkWrite(operations);
}


// creates data for single or multiple products
export const getProductBodyForDB = (productData, images=[]) => {
    let productDataDB;

    // for multiple products
  if(Array.isArray(productData)){

    // adding score, image URLs to each product
    productDataDB = productData.map(product => ({
      ...product,
      subcategory: undefined,
      price: Number(product.price), 
      score: 0, // ensures user cannot set the score manually

      // each product has a uniquePrefix used for all its images.
      // the frontend names images with this pattern:
      // uniquePrefix = "product_<random-string>_<timestamp>"
      // Image name =  "<uniquePrefix>_<original-image-name>"
      // On the server, we can filter uploaded images for each product
      // by matching the uniquePrefix.
      
      images: images.filter(file => file.originalname.startsWith(product.uniquePrefix))
      .map(file => file.path), //returns URLs
      
      // createdAt is automatically set on creation and locked against modification
      createdAt: undefined  
    })
  )
} else{
  
  // for a single product
  productDataDB = { 
    ...productData,
    subcategory: undefined,
    price: Number(productData.price),
    images: images.map(image => image.path), //returns URLs
    score: 0, // ensures user cannot set the score manually

    // createdAt is automatically set on creation and locked against modification
    createdAt: undefined
    
  }
}

return productDataDB;

}


// limits admin from creating products more than the specified limit
export const limitProductCreation = (productData) => {
  const BULK_CREATION_LIMIT = Number(process.env.BULK_CREATION_LIMIT_PER_REQUEST);

  if (Array.isArray(productData) && productData.length > BULK_CREATION_LIMIT) {
    throw new CustomError(
      'BadRequestError',
      `Cannot create more than ${BULK_CREATION_LIMIT} products at once`,
      400
    );
  }
};

// limits admin from creating products more than the specified limit (AI)
export const limitProductCreationAi = (productData) => {
  const BULK_CREATION_LIMIT_AI = Number(process.env.BULK_CREATION_LIMIT_AI);

  if (Array.isArray(productData) && productData.length > BULK_CREATION_LIMIT_AI) {
    throw new CustomError(
      'BadRequestError',
      `Cannot create more than ${BULK_CREATION_LIMIT_AI} products at once when using AI auto-generation`,
      400
    );
  }
};

// check missing fields that are required and dependen on admin's input
export const checkProductMissingFields = (productData) => {
  const missingFields = productData.some(p => {
    const set = new Set(Object.keys(p))
    return !(
      set.has('description') &&
      set.has('name') &&
      set.has('price') &&
      set.has('category')
    )
  })

  if (missingFields)
    throw new CustomError(
      'BadRequestError',
      'Missing required fields: description, name, price, category.',
      400)
}