//admin only operations

const CustomError = require('../../error-handling/customError.js');
const ProductModel = require('../../models/product.js');
const sendApiResponse = require('../../utils/apiResponse.js');
const { deleteCachedData, storeCachedData } = require('../../utils/helpers/cache.js');
const cacheKeyBuilders = require('../../constants/cacheKeyBuilders.js');
const cloudinary = require('../../configs/cloudinary.js');
const { 
    checkProductMissingFields,
    getProductBodyForDB, 
    limitImageUploads, 
    limitProductCreation, 
    limitProductCreationAi, 
    streamUpload
} = require('../../utils/helpers/product.js');
const generateProductFieldsAi = require('../../utils/ai/generateProductFieldsAi.js');


// create products with images
const createProductsWithImages = async (req, res, next) => {
    // Multer keeps JSON stringified
    const productData = JSON.parse(req.body.productData || '{}');

    if (Object.keys(productData).length === 0) {
        return next(new CustomError('BadRequestError', 'Product data is required', 400));
    }

    if (!req.files || req.files.length === 0) {
        return next(new CustomError('BadRequestError', 'Product images are required', 400));
    }

    // limit checks, throws error if limits exceeded
    limitProductCreation(productData);
    limitImageUploads(productData, req.files);

    // UPLOAD IMAGES TO CLOUDINARY

    let createdProductData;
    let uploadedImages = [];
    let session;
    try{

    console.time('Images upload');
    const imagesUploadPromises = req.files.map(f => 
        streamUpload(f.buffer, f.originalname)
    );

    // wait for all images to be uploaded
    uploadedImages = await Promise.all(imagesUploadPromises);
    console.timeEnd('Images upload');


    // get sanitized product body for DB (with images)
    const productDataDB = getProductBodyForDB(productData, uploadedImages.map(img => ({
        secure_url: img.secure_url,
        originalname: img.display_name
    })));

    // AI AUTO-GENERATION LOGIC

    let finalProductData;

    console.time('AI Generation');
    // If ?autoGeneration exists (fields to auto generate)
    if (req.query.autoGeneration) {
        const fieldsToAutoGenerate = Array.isArray(req.query.autoGeneration)
            ? req.query.autoGeneration
            : [req.query.autoGeneration || 'invalid'];

        // Validate product names
        const invalidNames = Array.isArray(productData) ? 
        productData.some(p => !p.name) : !productData.name;

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

        limitProductCreationAi(productData);
        checkProductMissingFields(productDataDB, fieldsToAutoGenerate)

        // AI generation
        finalProductData = await generateProductFieldsAi(
            productDataDB, 
            [...fieldsToAutoGenerate, 'subcategory']
        );
    }

    else {

        // throws err if required fields missing
        checkProductMissingFields(productDataDB, ['subcategory'])

        // let the AI generate 'subcategory' automatically (Default)
        finalProductData = await generateProductFieldsAi(productDataDB, ['subcategory']);
    }
    console.timeEnd('AI Generation');

    // SAVE PRODUCTS TO DB WITH TRANSACTION
    console.time('DB Transaction');
    session = await ProductModel.startSession();
    await session.withTransaction(async () => {
        createdProductData = await ProductModel.create(finalProductData, { session, ordered: true });
    });
    console.timeEnd('DB Transaction');
    
    return sendApiResponse(res, 201, {
        message: 'Product created successfully',
        data: createdProductData
    });

}
    catch(err){
        if(uploadedImages && uploadedImages.length > 0){

            // delete uploaded images from cloudinary on error
            cloudinary.api.delete_resources(uploadedImages.map(img => img.public_id))
                .catch(cleanupErr => console.error('Cloudinary cleanup failed:', cleanupErr));
        }

        return next(err);
    }

    finally{
        if(session){
            session.endSession();
        }
    }
}


// create products without images
const createProducts = async (req, res, next) => {
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
const adminUpdateProducts = async (req, res, next) => {
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
const adminDeleteProducts = async (req, res, next) => {
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
const adminUpdateProductByID = async (req, res, next) => {
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
const adminDeleteProductByID = async (req, res, next) => {
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

module.exports = { createProductsWithImages, createProducts, adminUpdateProducts, adminDeleteProducts, adminUpdateProductByID, adminDeleteProductByID }
