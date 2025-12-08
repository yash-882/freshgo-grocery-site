import productCategories from "../../constants/productCategories.js";
import CustomError from "../../error-handling/customError.js";
import generateAiResponse from "../../utils/aiChat.js";

// corrects typo in search queries using AI
export const typoCorrection = async (req, res, next) => {
    const searchValue = req.sanitizedQuery?.value;

    if (!searchValue) {
        return next(
            new CustomError('BadRequestError',
                'Search value is required!', 400))
    }

    const corrected = await generateAiResponse(
        `Your task is to correct grocery item names.
Return ONLY the corrected item name with no extra text.

Rules:
1. Fix spelling mistakes if they are clearly referring to a known grocery item.
2. If the input is already valid, return it unchanged.
3. If the input is unclear or not a grocery item, return a common grocery item that starts with the text of the search value.,
   taken only from the product subcategories(categories if not found in subcategories) list provided below.
4. Do not add explanations or any other text.

Product categories include: ${JSON.stringify(productCategories)}.

Input: ${searchValue}`)

    // skip correction for AI failure
    if (!corrected) {
        return next()
    }

    // attach the updated search value
    req.sanitizedQuery.value = corrected;
    next();
}