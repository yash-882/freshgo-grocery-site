// product router
import { Router } from 'express';
import {
    getProductByID,
    getProducts,
    searchProducts,
} from '../controllers/product.js';
import { schemaRegistery } from '../constants/schemaRegistery.js';
import { handleQuery } from '../middlewares/query.js';
import { checkCachedData } from '../middlewares/cache.js';
const productRouter = Router();


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
productRouter.get('/:id', checkCachedData('product', false), getProductByID)


export default productRouter;