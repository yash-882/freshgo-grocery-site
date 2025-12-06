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
        `You are a grocery assistant. Correct the following search value: ${searchValue}.
        Reply with only the corrected search value. No explanations, no text outside the corrected search value.
        If the search value is already correct, return it as it is.`);

    // skip correction for AI failure
    if (!corrected) {
        return next()
    }

    // attach the updated search value
    req.sanitizedQuery.value = corrected;
    next();
}