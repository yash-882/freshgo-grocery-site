const openai = require("../configs/openaiClient.js");

const generateAiResponse = async (prompt) => {
    const response = await openai.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
            {
                role: "system",
                content: prompt,
            },
        ],
        temperature: 0.7,
        
    })

    console.log('search value:', response.choices[0].message?.content?.trim());
    

    return response.choices[0].message?.content?.trim();
}

module.exports = generateAiResponse;