import CustomError from "../../error-handling/custom-error-class.js";
import OrderModel from "../../models/order-model.js";
import sendApiResponse from "../../utils/api-response.js";
import controllerWrapper from "../../utils/controller-wrapper.js";

// Admin controls over orders

export const getOrders = controllerWrapper(async (req, res, next) => {
    const { filter, sort, limit, skip, select } = req.sanitizedQuery;

    const orders = await OrderModel.find(filter)
        .populate({
            path: 'products.product',
            model: 'product',
            select: 'name price category'
        })
        .populate({
            path: 'user',
            model: 'user',
            select: 'name email'
        })
        .sort(sort)
        .limit(limit || 10)
        .skip(skip)
        .select(select);

    sendApiResponse(res, 200, {
        data: orders,
        dataLength: orders.length,
    });
});

// get order by ID
export const getOrderByID = controllerWrapper(async (req, res, next) => {
    const orderID = req.params.id;

    if (!orderID) {
        return next(new CustomError('BadRequestError', 'Order ID is required', 400));
    }

    const order = await OrderModel.findById(orderID)
        .populate({ // get products details
            path: 'products.product',
            model: 'product',
            select: 'name price category'
        })
        .populate({ // get user details
            path: 'user',
            model: 'user',
            select: 'name email'
        });

    if (!order) {
        return next(new CustomError('NotFoundError', 'Order not found', 404));
    }

    sendApiResponse(res, 200, {
        data: order
    });
});

// delete order
export const deleteOrderByID = controllerWrapper(async (req, res, next) => {
    const orderID = req.params.id;

    if (!orderID) {
        return next(new CustomError('BadRequestError', 'Order ID is required for deletion', 400));
    }

    const deletedOrder = await OrderModel.findByIdAndDelete(orderID);

    // no order found with the provided ID
    if (!deletedOrder) {
        return next(new CustomError('NotFoundError', 'Order not found', 404));
    }

    sendApiResponse(res, 200, {
        message: 'Order deleted successfully',
        data: deletedOrder
    });
});

// delete multiple orders
export const deleteOrders = controllerWrapper(async (req, res, next) => {
    const { filter, skip, limit } = req.sanitizedQuery;

    // filter is mandatory
    if (!filter || Object.keys(filter).length === 0) {
        return next(new CustomError('BadRequestError', 'Filter is required to delete orders!', 400));
    }

    // find orders to delete based on the filter, skip, and limit
    const ordersToDelete = await OrderModel.find(filter)
        .skip(skip)
        .limit(limit);

    if (ordersToDelete.length === 0) {
        return next(new CustomError('NotFoundError', 'No orders found for deletion', 404));
    }

    // get IDs 
    const orderIDsToDelete = ordersToDelete.map(order => order._id);

    // delete orders
    const deletionResult = await OrderModel.deleteMany({ _id: { $in: orderIDsToDelete } });

    sendApiResponse(res, 200, {
        message: `Deleted ${deletionResult.deletedCount} order(s) successfully`,
    });
});

// update order
export const updateOrderByID = controllerWrapper(async (req, res, next) => {
    const orderID = req.params.id;
    const updates = req.body;

    if (!orderID) {
        return next(new CustomError('BadRequestError', 'Order ID is required for updation', 400));
    }

    if (!updates || Object.keys(updates).length === 0) {
        return next(new CustomError('BadRequestError', 'Body is empty for updation!', 400));
    }

    // update order
    const order = await OrderModel.findByIdAndUpdate(orderID, updates, {
        new: true,
        runValidators: true
    })

    if (!order) {
        return next(new CustomError('NotFoundError', 'Order not found', 404));
    }

    sendApiResponse(res, 200, {
        message: 'Order updated successfully',
        data: order
    });
});

// update multiple order 
export const updateOrders = controllerWrapper(async (req, res, next) => {
    const { filter, skip, limit } = req.sanitizedQuery;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
        return next(new CustomError('BadRequestError', 'Body is empty for updation!', 400));
    }

    // filter is mandatory
    if (!filter || Object.keys(filter).length === 0) {
        return next(new CustomError('BadRequestError', 'Filter is required to update orders!', 400));
    }

    // define safe fields that can be updated in bulk
    const allowedBulkUpdateFields = ['orderStatus', 'paymentStatus', 'totalAmount']
    const updateFields = Object.keys(updates);

    // check for not-allowed to update fields
    const invalidFields = updateFields.filter(field => !allowedBulkUpdateFields.includes(field))
    if (invalidFields.length > 0) {
        return next(new CustomError('BadRequestError', `Cannot bulk update fields: ${invalidFields.join(', ')}`, 400));
    }

    // find orders to update based on the filter, skip, and limit
    const ordersToUpdate = await OrderModel.find(filter)
        .skip(skip)
        .limit(limit);

    if (ordersToUpdate.length === 0) {
        return next(new CustomError('NotFoundError', 'No orders found for updation', 404));
    }

    // get IDs 
    const orderIDsToUpdate = ordersToUpdate.map(order => order._id);

    // update orders
    const updateResult = await OrderModel.updateMany({ _id: { $in: orderIDsToUpdate } }, updates, {
        new: true,
        runValidators: true
    });

    sendApiResponse(res, 200, {
        message: `Updated ${updateResult.modifiedCount} order(s) successfully`,
    });
});


// get order stats
export const getOrderStats = controllerWrapper(async (req, res, next) => {
  const [statusBreakdown, revenueByPayment, totalRevenue, totalOrders] = await Promise.all([

    // get count of each order status
    OrderModel.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]),

    // get count and revenue of successful delivered orders for each payment method
    OrderModel.aggregate([
      { $match: { orderStatus: 'delivered' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $project: { paymentMethod: '$_id', count: 1, revenue: 1, _id: 0 } }
    ]),

    // total revenue from delivered orders
    OrderModel.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      { $project: { total: 1, _id: 0 } }
    ]),

    // total orders
    OrderModel.countDocuments()
  ]);

  sendApiResponse(res, 200, {
    data: {
      statusBreakdown: statusBreakdown,
      summary: {
        revenueByPayment: revenueByPayment,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    }
  });
});
