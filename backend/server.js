import './configs/load-env.js' //load environment variables
import mongoose from 'mongoose'
import app from './app.js'

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(console.log(`Connected to MongoDB successfully`))
  .catch(err => console.error('MongoDB connection error:', err))

// Listen on specified port
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`)
})