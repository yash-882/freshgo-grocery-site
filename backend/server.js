import './configs/load-env.js' //load environment variables
import mongoose from 'mongoose'
import redisClient from './configs/redis-client.js'
import app from './app.js'

// listens for Redis client errors
redisClient.on('error', (err) => console.error('Redis Client Error', err))

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