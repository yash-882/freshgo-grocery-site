import { Router } from 'express';
import { 
    createProduct, 
    deleteMyProductByID, 
    deleteMyProducts, 
    getMyProducts, 
    getProductByID, 
    getProducts, 
    updateMyProductByID } from '../controllers/product-controller.js';
import { authorizeUser, checkRequiredFields, roleBasedAccess } from '../middlewares/auth-middleware.js'
const productRouter = Router();

// product router

        //get my product: seller-only-route (mounted first to prevent /:id route conflict)
        productRouter.get('/mine', authorizeUser, roleBasedAccess('seller'), getMyProducts)

        // public routes
        productRouter.get('/', getProducts)
        productRouter.get('/:id', getProductByID)


        // protect seller-only routes
        productRouter.use(authorizeUser, roleBasedAccess('seller'))

        // seller only routes
        productRouter.post('/', createProduct)        //create product
        productRouter.delete('/', deleteMyProducts)        //delete multiple products
        productRouter.patch('/:id', updateMyProductByID) //update product
        productRouter.delete('/:id', deleteMyProductByID) //delete product


export default productRouter;