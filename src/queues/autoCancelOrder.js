const IOredisClient = require("../configs/ioredisClient.js");
const { Queue, Worker } = require('bullmq');
const OrderModel = require("../models/order.js");
const { updateProductsOnCancellation } = require("../utils/helpers/product.js");
const sendEmail = require("../utils/mailjet.js");

// create queue
const orderCancellationQueue = new Queue('auto-cancel-orders', { 
    connection: IOredisClient 
})

// initialize order fulfilment
const autoCancelOrder = async (job={}) => {
    try {
        const order = await OrderModel.findById(job.data?.orderID)

        // auto-cancel only if order is still in 'pending' state
        if(order && order.orderStatus === 'reached_destination'){
            order.orderStatus = 'cancelled';
            await order.save();
            console.log('Auto-cancelled order: ', job.data?.orderID);

            // restore stock
            await updateProductsOnCancellation(order.products, order.warehouse);

            // notify user via email
            await sendEmail(
                job.data?.email,
                'Order Cancelled',
                `Your order created on ${order.createdAt.toLocaleString()} has been automatically cancelled as it was not confirmed delivered within the expected time frame.`
            );
        }
    }

    catch (err) {
        console.log('Error occurred while auto-cancelling order: ', err);
        throw err; // triggers retry
    }
}


//  listens for jobs and executes them
new Worker('auto-cancel-orders', autoCancelOrder, { connection: IOredisClient })

module.exports = { orderCancellationQueue }