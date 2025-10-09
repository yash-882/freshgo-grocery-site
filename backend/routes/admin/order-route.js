// order routes (Admin-only)

import { Router } from 'express'
import { handleQuery } from '../../middlewares/query-middleware.js';
import { schemaRegistery } from '../../constants/schema-registery.js';
import { 
    deleteOrderByID, 
    deleteOrders, 
    getOrderByID, 
    getOrders, 
    getOrderStats, 
    updateOrderByID, 
    updateOrders } from '../../controllers/admin/order-controller.js';

const orderRouter = Router();

orderRouter.route('/')
  .get(handleQuery(schemaRegistery.order, true), getOrders)     // get all orders
  .delete(handleQuery(schemaRegistery.order, true), deleteOrders) // delete multiple orders
  .patch(handleQuery(schemaRegistery.order, true), updateOrders); // update multiple orders

orderRouter.route('/:id')
  .get(getOrderByID)      // get order by ID
  .patch(updateOrderByID) // update order by ID
  .delete(deleteOrderByID); // delete order by ID

// order stats
orderRouter.get('/stats', getOrderStats);

export default orderRouter;