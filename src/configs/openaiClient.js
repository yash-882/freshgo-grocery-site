// OPENAI Client (using groq site)

const openai = require('openai')

const client = new openai({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
})

module.exports = client;