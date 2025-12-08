const { Router } = require('express');
const {
    assignManagerToWarehouse,
    createWarehouse,
    deleteWarehouseByID,
    getWarehouseByID,
    getWarehouses,
    removeManagerFromWarehouse,
    updateWarehouseByID
} = require('../../controllers/admin/warehouse.js');
const { handleQuery } = require('../../middlewares/query.js');
const { schemaRegistery } = require('../../constants/schemaRegistery.js');

const warehouseRouter = Router();

// Admin only routes for warehouses

warehouseRouter.route('/assign-manager/:id')
    .patch(assignManagerToWarehouse); // Assign manager to a warehouse

warehouseRouter.route('/remove-manager/:id')
    .patch(removeManagerFromWarehouse); // Remove manager from a warehouse
    
warehouseRouter.route('/')
    .post(createWarehouse) // Create a new warehouse
    .get(handleQuery(schemaRegistery.warehouse), getWarehouses); // Get all warehouses

warehouseRouter.route('/:id')
    .get(getWarehouseByID) // Get warehouse by ID
    .patch(updateWarehouseByID) // Update warehouse by ID
    .delete(deleteWarehouseByID); // Delete warehouse by ID


module.exports = warehouseRouter;
