// initializes the order and updates its status in the background using BullMQ

import IOredisClient from "../../configs/ioredis-client.js";
import { Queue, Worker } from 'bullmq';
import OrderModel from "../../models/order-model.js";

// create queue
export const orderQueue = new Queue('orders', { connection: IOredisClient })

// initialize order fulfilment
export const startOrderProcessing = async (orderID) => {
    try {
        await orderQueue.add('updateStatus', {
            orderStatus: 'processing',
            orderID
        },
            {
                removeOnComplete: true, // remove the job after successful exeuction
                delay: 5000, //5 seconds (delay before the job runs for the first time)
                attempts: 5, // retry attempts if the job fails
                jobId: `${orderID}-${'processing'}`, //custom unique ID
                backoff: {
                    type: 'exponential', // delay for each retry: 2 sec -> 4 sec -> 8 sec ...
                    delay: 2000, //initial delay for retry 
                }
            })
    }

    catch (err) {
        console.log('Error occurred while starting the order flow: ', err);
        throw err; // triggers retry
    }
}

// update order status
const updateOrderStatus = async (job) => {
    try {
        // update order status
        await OrderModel.findOneAndUpdate({ _id: job.data.orderID },
            { $set: { orderStatus: job.data.orderStatus } },
            { new: true })

        console.log('JobID: ', job.id, 'Updated order status: ', job.data.orderStatus);

        // helps getting the next process
        const nextStatusMap = {
            placed: 'processing',
            processing: 'ready_for_pickup',
            ready_for_pickup: 'out_for_delivery',
            out_for_delivery: 'delivered'
        }

        // disallow creating jobs for specific states 
        if (['pending', 'cancelled', 'delivered'].includes(job.data.orderStatus)) {
            return;
        }

        const nextStatus = nextStatusMap[job.data.orderStatus]

        // schedule next job
        await orderQueue.add('updateStatus', {
            orderStatus: nextStatus,
            orderID: job.data.orderID
        },
            {
                removeOnComplete: true, // remove the job after successful exeuction
                delay: 1000 * 30, // 30 seconds (delay before the job runs for the first time)
                attempts: 5, // retry attempts if the job fails
                jobId: `${job.data.orderID}-${nextStatus}`, //custom unique ID
                backoff: {
                    type: 'exponential', // delay for each retry: 2 sec -> 4 sec -> 8 sec ...
                    delay: 2000, //initial delay for retry 
                }
            })
    }

    catch (err) {
        console.log('Error occurred while updating order status: ', err);
        throw err; // triggers retry
    }
}

//  listens for jobs and executes them
new Worker('orders', updateOrderStatus, { connection: IOredisClient })
