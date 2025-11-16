// warehouse_manager routes

import { Router } from 'express';
import { authorizeUser, roleBasedAccess } from '../../middlewares/auths.js';
import { getMyWarehouse } from '../../controllers/manager/warehouse.js';

const warehouseRouter = Router();

// Apply authentication and warehouse_manager role check to all routes in this router
warehouseRouter.use(authorizeUser, roleBasedAccess('warehouse_manager'));

// Get warehouses managed by the current user
warehouseRouter.get('/', getMyWarehouse);

export default warehouseRouter;