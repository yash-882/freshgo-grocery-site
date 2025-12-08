const { Router } = require('express');
const { authorizeUser, roleBasedAccess } = require('../../middlewares/auths.js');
const { schemaRegistery } = require('../../constants/schemaRegistery.js');
const {
    addProductsToMyWarehouse,
    deleteProductsFromMyWarehouse,
    getMyWarehouseProducts,
} = require('../../controllers/manager/product.js');
const { handleQuery } = require('../../middlewares/query.js');
const checkCachedData = require('../../middlewares/cache.js');
const checkManagedWarehouse = require('../../middlewares/checkManagedWarehouse.js');

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


module.exports = productRouterManager;