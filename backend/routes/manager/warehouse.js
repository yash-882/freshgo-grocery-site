// warehouse_manager routes

import { Router } from 'express';
import { authorizeUser, roleBasedAccess } from '../../middlewares/auths.js';
import { getMyWarehouseProducts } from '../../controllers/manager/product.js';
import { handleQuery } from '../../middlewares/query.js';
import { schemaRegistery } from '../../constants/schemaRegistery.js';
import { getMyWarehouse } from '../../controllers/manager/warehouse.js';

const warehouseRouter = Router();

// Apply authentication and warehouse_manager role check to all routes in this router
warehouseRouter.use(authorizeUser, roleBasedAccess('warehouse_manager'));

// Get warehouses managed by the current user
warehouseRouter.get('/', getMyWarehouse);

// Product management within managed warehouses
warehouseRouter.route('/manager')
    .get(handleQuery(schemaRegistery.product), getMyWarehouseProducts); // Get products in my managed warehouses


export default warehouseRouter;