// product router
import { Router } from 'express';
import {
    getProductByID,
    getProducts,
    productsRecommendations,
    searchProducts,
} from '../controllers/product.js';
import { schemaRegistery } from '../constants/schemaRegistery.js';
import { handleQuery } from '../middlewares/query.js';
import { checkCachedData } from '../middlewares/cache.js';
const productRouter = Router();
import { findNearbyWarehouse } from '../middlewares/findNearbyWarehouse.js';
import { typoCorrection } from '../middlewares/ai/typoCorrection.js';
import {authorizeUser} from '../middlewares/auths.js'

productRouter.use(findNearbyWarehouse);

// search products: public route
productRouter.get('/search',
    handleQuery(schemaRegistery.product),
    typoCorrection,
    checkCachedData('product', false),
    searchProducts)

// get products: public route
productRouter.get('/',
    handleQuery(schemaRegistery.product),
    checkCachedData('product', false),
    getProducts)

// products top 20 recommendations based on order history 
productRouter.get('/recommendations', 
    authorizeUser,
    handleQuery(schemaRegistery.product), 
    productsRecommendations
)    
    
// get product by ID: pubic route
productRouter.get('/:id', checkCachedData('product', false), getProductByID)


export default productRouter;