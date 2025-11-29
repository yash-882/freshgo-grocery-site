// OPENAI Client (using groq site)

import openai from 'openai'


const client = new openai({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
})

export default client;