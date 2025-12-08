// warehouse_manager routes

const { Router } = require('express');
const { authorizeUser, roleBasedAccess } = require('../../middlewares/auths.js');
const { getMyWarehouse } = require('../../controllers/manager/warehouse.js');

const warehouseRouter = Router();

// Apply authentication and warehouse_manager role check to all routes in this router
warehouseRouter.use(authorizeUser, roleBasedAccess('warehouse_manager'));

// Get warehouses managed by the current user
warehouseRouter.get('/', getMyWarehouse);

module.exports = warehouseRouter;