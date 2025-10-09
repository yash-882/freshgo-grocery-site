import IOredis from 'ioredis'

// redis client for BullMQ connection
const IOredisClient = new IOredis({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
})

export default IOredisClient