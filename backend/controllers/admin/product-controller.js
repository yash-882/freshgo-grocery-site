//admin only operations

import CustomError from '../../error-handling/custom-error-class.js';
import ProductModel from '../../models/product-model.js';
import controllerWrapper from '../../utils/controller-wrapper.js';
import sendApiResponse from '../../utils/api-response.js';
import { deleteCachedData, storeCachedData } from '../../utils/cache-helpers.js';
import cacheKeyBuilders from '../../constants/cache-key-builders.js';


// update multiple products
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
            update: {
                ...updates, 
                // ensure product's seller ID remain unchanged
                seller: product.seller
            }
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

// update product by ID
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

        // ensure product's seller ID remain unchanged
        seller: product.seller,
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

// delete product by ID 
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
