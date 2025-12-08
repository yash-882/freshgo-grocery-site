// order routes (Admin-only)

const { Router } = require('express')
const { handleQuery } = require('../../middlewares/query.js');
const { schemaRegistery } = require('../../constants/schemaRegistery.js');
const { 
    deleteOrderByID, 
    deleteOrders, 
    getOrderByID, 
    getOrders, 
    getOrderStats, 
    updateOrderByID, 
    updateOrders } = require('../../controllers/admin/order.js');

const orderRouter = Router();

orderRouter.route('/')
  .get(handleQuery(schemaRegistery.order), getOrders)     // get all orders
  .delete(handleQuery(schemaRegistery.order), deleteOrders) // delete multiple orders
  .patch(handleQuery(schemaRegistery.order), updateOrders); // update multiple orders


  // order stats
orderRouter.get('/stats', getOrderStats);

orderRouter.route('/:id')
  .get(getOrderByID)      // get order by ID
  .patch(updateOrderByID) // update order by ID
  .delete(deleteOrderByID); // delete order by ID

module.exports = orderRouter;