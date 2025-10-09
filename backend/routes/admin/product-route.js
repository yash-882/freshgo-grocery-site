// product routes (Admin-only)

import { Router } from 'express'
import { handleQuery } from '../../middlewares/query-middleware.js';
import { schemaRegistery } from '../../constants/schema-registery.js';
import { checkCachedData } from '../../middlewares/cache-middleware.js';
import { 
    adminDeleteProductByID, 
    adminDeleteProducts, 
    adminUpdateProductByID, 
    adminUpdateProducts } from '../../controllers/admin/product-controller.js';
import { getProductByID, getProducts } from '../../controllers/product-controller.js';

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

export default productRouter;