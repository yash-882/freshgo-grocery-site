import productCategories from '../../constants/productCategories.js';
import CustomError from '../../error-handling/customError.js';
import generateAiResponse from '../aiChat.js';

// auto-generates product fields using AI and returns the products

export const generateProductFieldsAi = async (prods=[], fieldsToAutoGenerate) => {
    console.log('fields', fieldsToAutoGenerate);
    
    if(prods.length === 0)
        throw new CustomError(
    'BadRequestError', 'Product name is required for generating description', 400);
    
    const products = await generateAiResponse(
`Add only the following field(s): ${fieldsToAutoGenerate.join(', ')}. 
Generate creative values for each product.

Rules:
1. 'description' – maximum 500 characters are allowed. (If included in fields above)
2. 'tags'[] – maximum 10 tags are allowed. (If included in fields above)
3. 'subcategory' must be included.
4. Subcategory must be chosen from: ${JSON.stringify(productCategories)}.
5. If any product seems like a spam or invalid grocery by its name, respond with JSON {error: "true"}

Respond ONLY with valid JSON[] for products.. no plain objects, No explanations, no text outside JSON.

Products: ${JSON.stringify(prods)}`)

const parsed = products ? JSON.parse(products): '';

if(parsed && (parsed.error === 'true' || parsed.error === true)){
    throw new CustomError('BadRequestError', 'Invalid product data or spam detected by AI. Please provide valid grocery products.', 400);
}

// server error
if(!parsed || parsed.length !== prods.length){
    throw new Error('Failed to generate product fields. Please try again.')
}

console.log('parsedd:',parsed);

    return parsed;
}
    
