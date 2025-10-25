import { Router } from 'express';
import { 
    createProduct, 
    deleteMyProductByID, 
    deleteMyProducts, 
    getMyProducts, 
    getProductByID, 
    getProducts, 
    searchProducts, 
    updateMyProductByID } from '../controllers/product.js';
    import { authorizeUser, roleBasedAccess } from '../middlewares/auths.js'
    import { schemaRegistery  } from '../constants/schemaRegistery.js';
    import { handleQuery } from '../middlewares/query.js';
    import { checkCachedData } from '../middlewares/cache.js';
import uploader from '../configs/multer.js';

    const productRouter = Router();
    
// product router

        //get my product: seller-only-route (mounted first to prevent /:id route conflict)
        productRouter.get('/mine', 
            authorizeUser, 
            roleBasedAccess('seller'),
            handleQuery(schemaRegistery.product), 
            checkCachedData('product', true), 
            getMyProducts
        )

        // search products: public route
        productRouter.get('/search',
            handleQuery(schemaRegistery.product),
            checkCachedData('product', false), 
            searchProducts)

        // get products: public route
        productRouter.get('/',
            handleQuery(schemaRegistery.product),
            checkCachedData('product', false), 
            getProducts)

        // get product by ID: pubic route
        productRouter.get('/:id', checkCachedData('product', false),  getProductByID)


        // protect seller-only routes
        productRouter.use(authorizeUser, roleBasedAccess('seller'))

// seller only routes:

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
    }).array('images', process.env.BULK_CREATION_LIMIT_PER_REQUEST * 5),
    createProduct) //create product


        productRouter.delete('/', 
            handleQuery(schemaRegistery.product), deleteMyProducts)//delete multiple products
        productRouter.patch('/:id', updateMyProductByID) //update product
        productRouter.delete('/:id', deleteMyProductByID) //delete product


export default productRouter;