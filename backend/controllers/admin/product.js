//admin only operations

import CustomError from '../../error-handling/customError.js';
import ProductModel from '../../models/product.js';
import controllerWrapper from '../../utils/controllerWrapper.js';
import sendApiResponse from '../../utils/apiResponse.js';
import { deleteCachedData, storeCachedData } from '../../utils/helpers/cache.js';
import cacheKeyBuilders from '../../constants/cacheKeyBuilders.js';
import cloudinary from '../../configs/cloudinary.js';
import { getProductBodyForDB, limitProductCreation } from '../../utils/helpers/product.js';

// create new product
export const createProduct = controllerWrapper(async (req, res, next) => {
    // Multer keeps the stringify data in req.body (express.json() can't parse it)
    const productData = JSON.parse(req.body.productData);

    if (!productData) {
        return next(new CustomError('BadRequestError', 'Product data is required', 400));
    }

    // body is empty
    if (Object.keys(productData).length === 0)
        return new CustomError('BadRequestError',
            `Please enter all required fields!`, 400)

    // throws error if products limit exceeds
    limitProductCreation(productData)

    // get product(s) body for insertion in DB
    const productDataDB = getProductBodyForDB(productData, req.files, req.user);

    // creating product...
    let createdProductData;

    try {
        createdProductData = await ProductModel.create(productDataDB);
    }
    catch (err) {
        // revert uploaded images by deleting them from Cloudinary
        await cloudinary.api.delete_resources(req.files.map(file => file.filename));

        return next(err)
    }

    //product created
    sendApiResponse(res, 201, {
        message: 'Product created successfully',
        data: createdProductData
    })
})


// update multiple products
export const adminUpdateProducts = controllerWrapper(async (req, res, next) => {
    if (Object.keys(req.body || {}).length === 0) {
        return next(new CustomError('BadRequestError', 'Body is empty for updation!', 400));
    }

    const { filter } = req.sanitizedQuery; // which products to update
    const updates = req.body; // updates

    updates.byAdmin = true;

    // update all matching products
    const result = await ProductModel.updateMany(filter, { $set: updates }, {
        runValidators: true,
    });

    if (result.matchedCount === 0) {
        return next(new CustomError('NotFoundError', 'No products found for update', 404));
    }

    // invalidate cached data
    const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
    await deleteCachedData(uniqueID, 'product');

    sendApiResponse(res, 200, {
        message: `Updated ${result.modifiedCount} product(s) successfully`,
    });
});


// delete multiple products (accessible roles: Admin only)
export const adminDeleteProducts = controllerWrapper(async (req, res, next) => {
    const { filter } = req.sanitizedQuery;

    // Delete all matching products
    const result = await ProductModel.deleteMany(filter);

    if (result.deletedCount === 0) {
        return next(new CustomError('NotFoundError', 'No products found for deletion', 404));
    }

    // Invalidate cached data if needed
    const uniqueID = cacheKeyBuilders.publicResources(req.sanitizedQuery);
    await deleteCachedData(uniqueID, 'product');

    sendApiResponse(res, 200, {
        message: `${result.deletedCount} product(s) deleted successfully`,
    });
});

// update product by ID
export const adminUpdateProductByID = controllerWrapper(async (req, res, next) => {
    if (Object.keys(req.body || {}).length === 0) {
        return next(new CustomError('BadRequestError', 'Body is empty for updation!', 400));
    }

    const productID = req.params.id;
    const updates = req.body;

    updates.byAdmin = true;
    const product = await ProductModel.findByIdAndUpdate(productID, { $set: updates }, {
        new: true,
        runValidators: true,
    });

    if (!product) {
        return next(new CustomError('NotFoundError', 'Product not found', 404));
    }


    const uniqueID = cacheKeyBuilders.publicResources(productID);
    await storeCachedData(uniqueID, { data: product }, 'product', true);

    sendApiResponse(res, 200, {
        data: product, //updated product
        message: 'Product updated successfully',
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
