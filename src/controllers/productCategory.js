// Categories with their subcategories for the frontend to display
// Other operations are done by the script (backend/scripts/productCategory.js)

import cacheKeyBuilders from "../constants/cacheKeyBuilders.js";
import CategoryModel from "../models/productCategory.js";
import sendApiResponse from "../utils/apiResponse.js";

import { storeCachedData } from "../utils/helpers/cache.js";

export const getCategories = async (req, res, next) => {
    const categories = await CategoryModel.find();

    if(categories.length > 0){
        const uniqueID = cacheKeyBuilders.publicResources(req.originalUrl)
        // for 2 hrs
        await storeCachedData(uniqueID, {data: categories, ttl: 9000}, 'category')
    }

    sendApiResponse(res, 200, {
        data: categories,
    })
}

export const getCategoryByName = async (req, res, next) => {
    const categoryName = req.params.name;
    const category = await CategoryModel.findOne({ name: categoryName });

    if(category !== null){
        const uniqueID = cacheKeyBuilders.publicResources(`${req.originalUrl}`)  
        await storeCachedData(uniqueID, {data: category, ttl: 600}, 'category')
    }

    sendApiResponse(res, 200, {
        data: category,
    })
}

