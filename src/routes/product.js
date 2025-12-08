// product router
const { Router } = require('express');
const {
    getProductByID,
    getProducts,
    productsRecommendations,
    searchProducts,
} = require('../controllers/product.js');
const { schemaRegistery } = require('../constants/schemaRegistery.js');
const { handleQuery } = require('../middlewares/query.js');
const checkCachedData = require('../middlewares/cache.js');
const productRouter = Router();
const findNearbyWarehouse = require('../middlewares/findNearbyWarehouse.js');
const typoCorrection = require('../middlewares/ai/typoCorrection.js');
const { authorizeUser } = require('../middlewares/auths.js')

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


module.exports = productRouter;