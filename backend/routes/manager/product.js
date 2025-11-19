import { Router } from 'express';
import { authorizeUser, roleBasedAccess } from '../../middlewares/auths.js';
import { schemaRegistery } from '../../constants/schemaRegistery.js';
import {
    addProductsToMyWarehouse,
    deleteProductsFromMyWarehouse,
    getMyWarehouseProducts,
} from '../../controllers/manager/product.js';
import { handleQuery } from '../../middlewares/query.js';
import { checkManagedWarehouse } from '../../middlewares/checkManagedWarehouse.js';
import { checkCachedData } from '../../middlewares/cache.js';

const productRouterManager = Router();

// Apply authentication and warehouse_manager role 
productRouterManager.use(
    authorizeUser, 
    roleBasedAccess('warehouse_manager'),
    checkManagedWarehouse
);

// Product management within managed warehouses
productRouterManager.route('/')
    .get(handleQuery(schemaRegistery.product), checkCachedData('product'), getMyWarehouseProducts); // Get products in my managed warehouses

productRouterManager.route('/')
    .patch(addProductsToMyWarehouse) // Add/update products in specific warehouses
    .delete(deleteProductsFromMyWarehouse); // Delete products from specific warehouses


    export default productRouterManager