// product router
const { Router } = require('express');
const {
    getProductByID,
    getProducts,
    productsRecommendations,
    searchProducts,
    searchProductsByImage,
} = require('../controllers/product.js');
const { handleQuery } = require('../middlewares/query.js');
const checkCachedData = require('../middlewares/cache.js');
const { authorizeUser } = require('../middlewares/auths.js')
const typoCorrection = require('../middlewares/ai/typoCorrection.js');
const { schemaRegistery } = require('../constants/schemaRegistery.js');
const findNearbyWarehouse = require('../middlewares/findNearbyWarehouse.js');
const uploader = require('../configs/multer.js');
const validateImageInput = require('../middlewares/validateImageInput.js');

const productRouter = Router();

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

// get products by image: public route
productRouter.post('/image-search',
    uploader({
        fileSize: 1024 * 1024 * 2, // 2MB
        allowedFileFormats: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff'],
        fileType: 'image'
    }).single('image'),
    
    validateImageInput, // validates req.file (if parsed) or URL
    searchProductsByImage
)

// products top 20 recommendations based on order history 
productRouter.get('/recommendations', 
    authorizeUser,
    handleQuery(schemaRegistery.product), 
    productsRecommendations
)    
    
// get product by ID: pubic route
productRouter.get('/:id', checkCachedData('product', false), getProductByID)


module.exports = productRouter;