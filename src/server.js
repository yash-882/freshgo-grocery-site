// handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught Exception! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

import './configs/loadEnv.js' //load environment variables
import mongoose from 'mongoose'
import redisClient from './configs/redisClient.js'
import app from './app.js'
import ioredisClient from './configs/ioredisClient.js'


// listens for Redis client errors (used for storage)
redisClient.on('error', (err) => console.error('Redis Client Error', err))

// listens for Redis client errors (used for queues)
ioredisClient.on('error', (err) => console.error('IORedis Client Error', err))

// connect to Redis
redisClient.connect()
  .then(() => console.log('Connected to Redis successfully'))
  .catch(err => console.error('Redis connection error:', err))

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(`Connected to MongoDB successfully`))
  .catch(err => console.error('MongoDB connection error:', err))

// Listen on specified port
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`)
})