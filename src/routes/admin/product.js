// product routes (Admin-only)

const { Router } = require('express')
const { handleQuery } = require('../../middlewares/query.js');
const { schemaRegistery } = require('../../constants/schemaRegistery.js');
const {
    createProductsWithImages,
    adminDeleteProductByID,
    adminDeleteProducts,
    adminUpdateProductByID,
    adminUpdateProducts,
    createProducts
} = require('../../controllers/admin/product.js');
const uploader = require('../../configs/multer.js');


const productRouter = Router();

// operations for multiple products
productRouter.route('/')
    .patch(handleQuery(schemaRegistery.product), adminUpdateProducts)
    .delete(handleQuery(schemaRegistery.product, true), adminDeleteProducts)

// operations for a single product
productRouter.route('/:id')
    .patch(adminUpdateProductByID)
    .delete(adminDeleteProductByID)

// create product
productRouter.post('/with-images',

    // product image uploader
    uploader({
        allowedFileFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        fileSize: 1024 * 1024 * 1, // should be max 1MB 
        folder: 'products',
        fileType: 'image',
        saveFormat: 'jpeg', //save images in jpeg format
    }).array('images'),

    createProductsWithImages) //create product

    productRouter.post('/', createProducts) //create product without images

module.exports = productRouter;