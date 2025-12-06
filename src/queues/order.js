// initializes the order and updates its status in the background using BullMQ

import IOredisClient from "../configs/ioredisClient.js";
import { Queue, Worker } from 'bullmq';
import OrderModel from "../models/order.js";
import { orderCancellationQueue } from "./autoCancelOrder.js";
import nextStatusMap from "../constants/orderNextStatuses.js";
import { getRemainingDeliveryTime } from "../utils/helpers/order.js";

// create queue
export const orderQueue = new Queue('orders', { connection: IOredisClient })

// initialize order fulfilment
export const startOrderProcessing = async (data) => { 
    try {
        // update order status to 'processing' after 5 seconds
        await orderQueue.add('updateStatus', {
            ...data, // usually email and orderID
            orderStatus: 'processing'
        },
        {
            removeOnComplete: true, // remove the job after successful exeuction
            attempts: 5, // retry attempts if the job fails
            jobId: `${data.orderID}-${'processing'}`, //custom unique ID
            backoff: {
                type: 'exponential', // delay for each retry: 2 sec -> 4 sec -> 8 sec ...
                delay: 2000, //initial delay for retry 
            }
        })
        console.log('Order flow started successfully:', data);
    }
    
    catch (err) {
        console.log('Error occurred while starting the order flow: ', err);
        throw err; // triggers retry
    }
}

// update order status
const updateOrderStatus = async (job) => {
    try {

        const order = await OrderModel.findById(job.data.orderID)

        if(!order) 
            throw new Error('Order not found!');
        
        if(order.orderStatus === 'reached_destination'){
            // schedule auto-cancellation after 2 minute of reaching destination
            await orderCancellationQueue.add('cancelOrder', {
                ...job.data,
                orderStatus: 'cancelled',
            }, {
                removeOnComplete: true, // remove the job after successful exeuction
                delay: 1000 * 60 * 2, // 2 minutes
                attempts: 5, // retry attempts if the job fails
            })
            return;
        }
        
        // skip scheduling a new job on these order states
        const skipStatuses = ['pending', 'delivered', 'cancelled', 'reached_destination']
        if(skipStatuses.includes(order.orderStatus)) return;

        // get remaining delivery time (returns milliseconds)
        const deliveryRemainingTime = getRemainingDeliveryTime(job.data.orderStatus)

        // change order status and delivery time
        order.orderStatus = job.data.orderStatus;
        order.expectedDeliveryAt = new Date(Date.now() + deliveryRemainingTime)

        // save order
        await order.save();

        console.log('JobID: ', job.id, 'Updated order status in DB: ', job.data.orderStatus);

        const {
            next: nextStatus = null,
            finishesIn: nextStatusRunsIn = null } = nextStatusMap[job.data.orderStatus] || {}
        
        // schedule next job
        await orderQueue.add('updateStatus', {
            ...job.data,
            orderStatus: nextStatus
        },
            {
                removeOnComplete: true, // remove the job after successful exeuction
                delay: nextStatusRunsIn, // delay before the job runs
                attempts: 5, // retry attempts if the job fails
                jobId: `${job.data.orderID}-${nextStatus}`, //custom unique ID
                backoff: {
                    type: 'exponential', // delay for each retry: 2 sec -> 4 sec -> 8 sec ...
                    delay: 2000, //initial delay for retry 
                }
            })

            console.log('Next status added to Job:', nextStatus);
            
    }

    catch (err) {
        console.log('Error occurred while updating order status: ', err);

        if(err.message !== 'Order not found!')
        throw err; // triggers retry
    }
}

//  listens for jobs and executes them
new Worker('orders', updateOrderStatus, { connection: IOredisClient })