// controllers used by warehouse_manager

import ProductModel from './../../models/product.js';
import CustomError from '../../error-handling/customError.js';
import sendApiResponse from '../../utils/apiResponse.js';
import controllerWrapper from '../../utils/controllerWrapper.js';
import mongoose from 'mongoose';

// Get my warehouse products (warehouse_manager)
export const getMyWarehouseProducts = controllerWrapper(async (req, res, next) => {
  const { filter, sort, limit, skip, select } = req.sanitizedQuery;

  const managedWarehouse = req.managedWarehouse

  const combinedFilter = { ...filter, 'warehouses.warehouse': managedWarehouse };

  const products = await ProductModel.find(combinedFilter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(select)
    .populate({
      path: 'warehouses.warehouse',
      select: 'name -_id',
      model: 'warehouse',
    });

  sendApiResponse(res, 200, { data: products, dataLength: products.length });
});

// Delete multiple products from my warehouse
export const deleteProductsFromMyWarehouse = controllerWrapper(async (req, res, next) => {
  const productIDs = req.body; // array of productIDs

  if (!Array.isArray(productIDs) || productIDs.length === 0) {
    return next(new CustomError('BadRequestError', 'Product IDs are required', 400));
  }

  // manager's warehouse
  const managedWarehouse = req.managedWarehouse;

  // Check that all products exist
  const productsInDB = await ProductModel.find({ _id: { $in: productIDs } });
  if (productsInDB.length !== productIDs.length) {
    return next(new CustomError('NotFoundError', 'Some products not found, remove them and try again', 404));
  }

  // Prepare bulk deletion operations
  const bulkDelete = productIDs.map(productID => ({
    updateOne: {
      filter: { _id: productID },
      update: { $pull: { warehouses: { warehouse: managedWarehouse } } }
    }
  }));

  // If one update fails, all others fail too
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await ProductModel.bulkWrite(bulkDelete, { session });
    });

    sendApiResponse(res, 200, {
      message: `Deleted ${result.modifiedCount} product(s) successfully from your warehouse`,
    });
  } catch (err) {
    next(err);
  } finally {
    if (session) session.endSession();
  }
});

// Add products in warehouse manager's warehouse (updates quantity if the product already exist)
export const addProductsToMyWarehouse = controllerWrapper(async (req, res, next) => {
  const productsToAdd = req.body;

  if(!Array.isArray(productsToAdd) || productsToAdd.length === 0){
    return next(new CustomError('BadRequestError', 'products data is required!', 400));
  }

  if(productsToAdd.some(product => !product.productID || product.quantity === undefined)){
    return next(new CustomError('BadRequestError', 'Each product must have productID and quantity', 400));
  }

// manager's warehouse
  const managedWarehouse = req.managedWarehouse;

  const productIDs = productsToAdd.map(product => product.productID);

  const productsInDB = await ProductModel.find({_id: {$in: productIDs}});
  if(productsInDB.length !== productIDs.length){
    return next(new CustomError('NotFoundError', 'Some products not found, remove them and try again', 404));
  }


  const existingProducts = await ProductModel.find({
    _id: { $in: productIDs },
    'warehouses.warehouse': managedWarehouse,
  }).select('_id warehouses.quantity');

  // Set of existing products in the warehouse
  const existingSet = new Set(existingProducts.map(product => product._id.toString()));

  const aggregated = {};

  // prevents multiple updation for duplicate products
  for (const { productID, quantity } of productsToAdd) {
    aggregated[productID] = (aggregated[productID] || 0) + quantity;
  }

  // Prepareupdates to be applied
  const bulkUpdate = Object.entries(aggregated).map(([ productID, quantity ]) => {
    let filter = {}, update = {}

    // increment the product count for the existing warehouse
    if (existingSet.has(productID)) {
      filter = { _id: productID, 'warehouses.warehouse': managedWarehouse }
      update = { $inc: { 'warehouses.$.quantity': quantity } }
    }

    // add warehouse to the product
    else {
      filter = { _id: productID }
      update = { $push: { warehouses: { warehouse: managedWarehouse, quantity } } }
    }

    return {
      updateOne: { filter, update }
    }

  })

  // If one update fails, all others fail too
  let session;
  let updatedProducts;

  try {
    // run transaction
    // if any update fails for a doc, all operations will be reverted back
    session = await mongoose.startSession();
    await session.withTransaction(async () => {

      // Add warehouses (MongoDB internally runs separate updates)
      updatedProducts = await ProductModel.bulkWrite(bulkUpdate, { throwOnValidationError: true });
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }

    sendApiResponse(res, 200, {
      message: `Added ${updatedProducts.modifiedCount} product(s) successfully in your warehouse`,
    });
});