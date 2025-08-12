import {createClient} from 'redis' //database-like service to store data in key-value pairs

// client to connect to Redis
const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

export default client