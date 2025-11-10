// product routes (Admin-only)

import { Router } from 'express'
import { handleQuery } from '../../middlewares/query.js';
import { schemaRegistery } from '../../constants/schemaRegistery.js';
import { checkCachedData } from '../../middlewares/cache.js';
import {
    createProduct,
    adminDeleteProductByID,
    adminDeleteProducts,
    adminUpdateProductByID,
    adminUpdateProducts
} from '../../controllers/admin/product.js';
import { getProductByID, getProducts } from '../../controllers/product.js';
import uploader from '../../configs/multer.js';


const productRouter = Router();

// operations for multiple products
productRouter.route('/')
    .get(handleQuery(schemaRegistery.product, true), checkCachedData('product', true), getProducts)
    .patch(handleQuery(schemaRegistery.product, true), adminUpdateProducts)
    .delete(handleQuery(schemaRegistery.product, true), adminDeleteProducts)

// operations for a single product
productRouter.route('/:id')
    .get(checkCachedData('product', true), getProductByID)
    .patch(adminUpdateProductByID)
    .delete(adminDeleteProductByID)

// create product
productRouter.post('/',

    // product image uploader
    uploader({
        allowedFileFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        fileSize: 1024 * 1024 * 1, // should be max 1MB 
        folder: 'products',
        fileType: 'image',
        saveFormat: 'jpeg', //save images in jpeg format
        // 5 images per product
    }).array('images'),
    createProduct) //create product

export default productRouter;