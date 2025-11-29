//admin only operations

import CustomError from '../../error-handling/customError.js';
import ProductModel from '../../models/product.js';
import sendApiResponse from '../../utils/apiResponse.js';
import { deleteCachedData, storeCachedData } from '../../utils/helpers/cache.js';
import cacheKeyBuilders from '../../constants/cacheKeyBuilders.js';
import cloudinary from '../../configs/cloudinary.js';
import { 
    checkProductMissingFields,
    getProductBodyForDB, 
    limitProductCreation, 
    limitProductCreationAi 
} from '../../utils/helpers/product.js';
import { generateProductFieldsAi } from '../../utils/ai/generateProductFieldsAi.js.js';


// create products with images
export const createProductsWithImages = async (req, res, next) => {
    // Multer keeps JSON stringified
    const productData = JSON.parse(req.body.productData);

    if (!productData) {
        return next(new CustomError('BadRequestError', 'Product data is required', 400));
    }

    if (Object.keys(productData).length === 0)
        return next(
            new CustomError(
                'BadRequestError',
                `Please enter all required fields! ${ProductModel.schema.requiredPaths()}`,
                400
            )
        );

    // throws error if products limit exceeds
    limitProductCreation(productData);

    // get sanitized product body for DB (with images)
    const productDataDB = getProductBodyForDB(productData, req.files);

    // AI AUTO-GENERATION LOGIC

    let finalProductData;

    // If ?autoGeneration exists
    if (req.query.autoGeneration) {
        const fieldsToAutoGenerate = Array.isArray(req.query.autoGeneration)
            ? req.query.autoGeneration
            : [req.query.autoGeneration];

        // Validate product names
        const invalidNames = productData.some(p => !p.name);

        // disallowed fields
        const notAllowedFields = fieldsToAutoGenerate.filter(
            field => !['tags', 'description',].includes(field)
        );

        if (invalidNames || notAllowedFields.length > 0) {
            return next(
                new CustomError(
                    'BadRequestError',
                    invalidNames
                        ? 'Product name is required for generating description'
                        : `Field(s): ${notAllowedFields.join(', ')}, are not allowed for auto generation.`,
                    400
                )
            );
        }

        // limit products for AI
        limitProductCreationAi(productData);

        // AI generation
        finalProductData = await generateProductFieldsAi(productDataDB, fieldsToAutoGenerate);
    }

    else {

        // throws err if required fields missing
        checkProductMissingFields(productDataDB)

        // let the AI generate 'subcategory' automatically
        finalProductData = await generateProductFieldsAi(productDataDB, ['subcategory']);
    }


    // SAVE PRODUCT
    let createdProductData;

    try {
        createdProductData = await ProductModel.create(finalProductData);
    } catch (err) {
        // revert uploaded images from Cloudinary
        await cloudinary.api.delete_resources(req.files.map(file => file.filename));
        return next(err);
    }

    sendApiResponse(res, 201, {
        message: 'Product created successfully',
        data: createdProductData
    });
}


// create products without images
export const createProducts = async (req, res, next) => {
    const products = Array.isArray(req.body) ? req.body :  [req.body];

    if(products.length === 0)
        return next(new CustomError('BadRequestError', 'Product data is required', 400));
    

    // throws error if products limit exceeds
    limitProductCreation(products)

    let productData;
    const productBody = getProductBodyForDB(products);

    // if auto-generation 
    if(req.query.autoGeneration) {

        // get fields to auto-generate
        const fieldsToAutoGenerate = Array.isArray(req.query.autoGeneration) ? 
        req.query.autoGeneration : [req.query.autoGeneration];
        
        const invalidNames = products.some(p => !p.name);
        const notAllowedFields = fieldsToAutoGenerate.filter(field => !['tags', 'description' ].includes(field));

        // throw err
        if (invalidNames || notAllowedFields.length > 0)
            return next(new CustomError(
        'BadRequestError',
        invalidNames ?
        'Product name is required for generating description'
                    : `Field(s): ${notAllowedFields.join(', ')}, are not allowed for auto generation.`,
                400));
                
                limitProductCreationAi(products) //limit products for AI auto-generation
                productData = await generateProductFieldsAi(productBody, fieldsToAutoGenerate)
            }
            
            else{
                // throws err if required fields missing
                checkProductMissingFields(productBody)

                // let the AI generate 'subcategory' automatically
                productData = await generateProductFieldsAi(productBody, ['subcategory']);
            }


    const createdProducts =  await ProductModel.create(productData || products)

    sendApiResponse(res, 201, {
        message: 'Product created successfully',
        data: createdProducts
    })
}

// update multiple products
export const adminUpdateProducts = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
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
}


// delete multiple products (accessible roles: Admin only)
export const adminDeleteProducts = async (req, res, next) => {
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
}

// update product by ID
export const adminUpdateProductByID = async (req, res, next) => {
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
}

// delete product by ID 
export const adminDeleteProductByID = async (req, res, next) => {
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

}
