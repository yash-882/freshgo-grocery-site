import CustomError from '../../error-handling/custom-error-class.js';
import controllerWrapper from '../../utils/controller-wrapper.js';
import sendApiResponse from '../../utils/api-response.js';
import { orderQueue } from '../../queues/order/order-status.js';

// all queues
const queues = {
    orders: orderQueue
}

// retry all failed jobs for each queue
export const retryFailedJobs = controllerWrapper(async (req, res, next) => {
    const jobsToRetry = []
    const failedQueues = {} //count of failed jops in with the queue name
    let queuesToRetry = 0

    for (const queueName in queues) {

        const failedJobs = await queues[queueName].getFailed()
        failedQueues[queueName] = failedJobs.length // set the count of failed jobs in the queue


        if (failedJobs.length > 0) {
            queuesToRetry++

            jobsToRetry.push(
                ...failedJobs.map(job => job.retry()) // .retry returns promise
            )
        }
    }

    // no failed job found for retry
    if (jobsToRetry.length === 0) {
        return sendApiResponse(res, 200, {
            message: 'No failed jobs found'
        })
    }

    // retry all failed jobs
    await Promise.all(jobsToRetry)

    sendApiResponse(res, 201, {
        message: `Retried ${jobsToRetry.length} failed job(s) of ${queuesToRetry} queue(s)`,
        data: failedQueues
    })
})

// pause a queue by 'name'
export const pauseQueue = controllerWrapper(async (req, res, next) => {
    const queueName = req.params.queueName;
    const queue = queues[queueName]

    if (!queue) {
        return next(new CustomError('NotFoundError', 'Queue not found', 404))
    }

    // queue is already paused
    if (queue.isPaused()) {
        return next(new CustomError('BadRequestError', `Queue: "${queueName}" is already paused`, 400))
    }

    // pause single queue (the workers of this queue will not accept any new job after pausing)
    await queue.pause()
})

// pause all queues
export const pauseAllQueues = controllerWrapper(async (req, res, next) => {
    const queueNames = Object.keys(queues)

    if (queueNames.length === 0) {
        return next(new CustomError('NotFoundError', 'No queues found to pause', 404))
    }

    // get unpaused queues
    const queuesToPause = queueNames.filter(queueName => !queues[queueName].isPaused())

    if(queuesToPause.length === 0){
        return next(new CustomError('BadRequestError', 'All queues are already paused', 400))
    }

    // pause each queue
    for (const queueName of queuesToPause) {
 
        // pause queue (the workers of this queue will not accept any new job after pausing)
        await queues[queueName].pause()

    }

    sendApiResponse(res, 200, {
        message: `${queuesToPause.length} queues paused successfully`
    })
})

// resume a queue by 'name'

export const resumeQueue = controllerWrapper(async (req, res, next) => {
    const queueName = req.params.queueName;
    const queue = queues[queueName]

    if (!queue) {
        return next(new CustomError('NotFoundError', 'Queue not found', 404))
    }
    // queue is already resumed
    if (!(await queue.isPaused())) {
        return next(new CustomError('BadRequestError', `Queue: "${queueName}" is already resumed`, 400))
    }

    // get delayed jobs 
    const delayedJobs = await queue.getDelayed()

    if (delayedJobs.length > 0) {

        for (const job of delayedJobs) {
            await job.remove() //remove old job

            // create the same job with but with modified remaining delay
            const passedTime = Date.now() - job.timestamp
            const remainingDelay = Math.max(job.delay - passedTime, 0)

            // add job
            await queue.add(job.name, job.data, {
                // copy options
                ...job.opts, 
                jobId: job.id,
                delay: remainingDelay  //remaining delay
            })
        }
    }

    // resume single queue
    await queue.resume()

    sendApiResponse(res, 200, {
        message: `Queue: "${queueName}" resumed successfully`
    })
})

// resume all queues
export const resumeAllQueues = controllerWrapper(async (req, res, next) => {
    const queueNames = Object.keys(queues);

    if (queueNames.length === 0) {
        return next(new CustomError('NotFoundError', 'No queues found to resume', 404));
    }

    // get paused queues
    const queuesToResume = [];
    for (const queueName of queueNames) {
        if (await queues[queueName].isPaused()) {
            queuesToResume.push(queueName);
        }
    }

    if (queuesToResume.length === 0) {
        return next(new CustomError('BadRequestError', 'All queues are already resumed', 400));
    }

    // resume each paused queue and reschedule delayed jobs
    for (const queueName of queuesToResume) {
        const queue = queues[queueName];
        const delayedJobs = await queue.getDelayed();

        // create new jobs with the remaining delay (data, opts and id remain same)
        await Promise.all(
            delayedJobs.map(async (job) => {
                await job.remove();
                // calculate remaining delay
                const remainingDelay = Math.max(job.delay - (Date.now() - job.timestamp), 0);
                await queue.add(job.name, job.data, { 
                    ...job.opts, 
                    jobId: job.id, 
                    delay: remainingDelay 
                });
            }));

        // resume the queue
        await queue.resume();
    }

    sendApiResponse(res, 200, {
        message: `${queuesToResume.length} queues resumed successfully`
    });
});
