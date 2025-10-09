// queue routes (Admin-only)

import { Router } from 'express'

import { 
    pauseAllQueues, 
    pauseQueue, 
    resumeAllQueues, 
    resumeQueue, 
    retryFailedJobs } from '../../controllers/admin/queue-controller.js';

const queueRouter = Router();

queueRouter.post('/retry-failed', retryFailedJobs) // retry failed jobs
queueRouter.post('/pause/:queueName', pauseQueue) // pause a queue
queueRouter.post('/pause-all', pauseAllQueues) // pause all queues
queueRouter.post('/resume/:queueName', resumeQueue) // resume a queue
queueRouter.post('/resume-all', resumeAllQueues) // resume all queues

export default queueRouter;