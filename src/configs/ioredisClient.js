const IOredis = require('ioredis')

// redis client for BullMQ connection
const IOredisClient = new IOredis({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    retryStrategy: (times) => {
        // reconnect after 
        // (exponential delay before each retry: 50 -> 100 -> 150 -> ...upto 2000ms)
        return Math.min(times * 50, 2000) 
    },
    maxRetriesPerRequest: null,
})

module.exports = IOredisClient