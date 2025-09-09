import { Router } from 'express';
import { 
    createProduct, 
    deleteMyProductByID, 
    deleteMyProducts, 
    getMyProducts, 
    getProductByID, 
    getProducts, 
    updateMyProductByID } from '../controllers/product-controller.js';
import { authorizeUser, roleBasedAccess } from '../middlewares/auth-middleware.js'
import { schemaRegistery  } from '../constants/schema-registery.js';
import { handleQuery } from '../middlewares/query-middleware.js';
import { checkCachedData } from '../middlewares/cache-middleware.js';
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

        // public routes
        productRouter.get('/',
            handleQuery(schemaRegistery.product),
            checkCachedData('product', false), 
            getProducts)
        // public route
        productRouter.get('/:id', checkCachedData('product', false),  getProductByID)


        // protect seller-only routes
        productRouter.use(authorizeUser, roleBasedAccess('seller'))

        // seller only routes
        productRouter.post('/', createProduct)        //create product
        productRouter.delete('/', 
            handleQuery(schemaRegistery.product), deleteMyProducts)//delete multiple products
        productRouter.patch('/:id', updateMyProductByID) //update product
        productRouter.delete('/:id', deleteMyProductByID) //delete product


export default productRouter;