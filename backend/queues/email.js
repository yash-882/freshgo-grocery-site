// Add emails to queue and sends it after a specfied delay 

import { Queue, Worker } from 'bullmq';
import IOredisClient from '../configs/ioredisClient.js';
import sendEmail from '../utils/mailer.js';

// create a queue for emails
export const emailQueue = new Queue('emails', {
    connection: IOredisClient,
});

// adds an email to the queue
export const addEmailToQueue = async (to, subject, text) => {
    try {
        await emailQueue.add('sendEmail', { to, subject, text }, {
            removeOnComplete: true, // remove job from queue when completed
            attempts: 3, // retry up to 3 times on failure
            backoff: {
                type: 'exponential',
                delay: 1000, // initial delay of 1 second, then 2s, 4s, etc
            },
        });
        console.log(`Email job added to queue for ${to}`);
    } catch (err) {
        console.log('Failed to add email to queue:', err);
        throw err; // throw error to trigger retry mechanism
    }
};

// a worker to process jobs from the email queue
new Worker('emails', async (job) => {
    const { to, subject, text } = job.data;
    console.log(`Processing email job for ${to}`);
    try {
        await sendEmail(to, subject, text);
        console.log(`Email sent successfully to ${to}`);
    } catch (err) {
        console.log(`Failed to send email to ${to}:`, err);
        throw err; // throw error to trigger retry mechanism
    }
}, { connection: IOredisClient });
