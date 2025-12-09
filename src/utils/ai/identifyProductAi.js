const openai = require("../../configs/openaiClient");
const CustomError = require("../../error-handling/customError");

// Products subcategories
const subcategoriesList = require('../../constants/productCategories')
    .flatMap(cat => cat.subcategories)
    .map(subcat => subcat.replace(/_/g, ' '));

// Only supports image buffers and URL
const identifyProductAi = async (image, isURL = false) => {

    if (!image) {
        throw new CustomError('BadRequestError', 'Image is required for identification.', 400);
    }
    
    let imageInput;
    if (isURL)
        imageInput = image //url
    else {
        const base64Image = image.buffer?.toString('base64')
        imageInput = `data:${image.mimetype};base64,${base64Image}` //valid format for base64 images
    }

        const response = await openai.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are a Grocery products identifier. 
                        Identify the product in the image and return its subcategory from the following list: 
                        ${subcategoriesList.join(', ')}.
                        Rules:
                      - Respond with RAW JSON only. Do NOT use markdown, code blocks, or backticks.
                      - If the product doesn't match any subcategory, respond with {"result":"NotFound"}.
                      - If the image contains NSFW content, respond with {"result":"NSFW"}.
                      - If multiple products appear, identify the most prominent one.
                      - The final answer must be ONLY {"result": "subcategoryName"} or {"result": "brandName <space> subcategoryName"} if you are more than 70% sure of the identification.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageInput,
                            },
                        },
                    ],
                },
            ]
        })

        const result = response.choices[0].message?.content?.trim();

        if (!result) {
            throw new Error('Failed to identify product from image.');
        }

        console.log(result);

        const parsed = JSON.parse(result);

        // inappropriate content
        if (parsed.result === 'NSFW')
            throw new CustomError('BadRequestError', 'Image contains NSFW content.', 400);

        // product is not found in our store
        else if (parsed.result === 'NotFound')
            throw new CustomError('BadRequestError', 'The product you searched for isn’t something we sell.', 400)

        return parsed.result;
}

module.exports = identifyProductAi;