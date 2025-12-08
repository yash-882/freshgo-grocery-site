// Categories with their subcategories for the frontend to display
// Other operations are done by the script (backend/scripts/productCategory.js)

const cacheKeyBuilders = require("../constants/cacheKeyBuilders.js");
const CategoryModel = require("../models/productCategory.js");
const sendApiResponse = require("../utils/apiResponse.js");
const { storeCachedData } = require("../utils/helpers/cache.js");

const getCategories = async (req, res, next) => {
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

const getCategoryByName = async (req, res, next) => {
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

module.exports = { getCategories, getCategoryByName }

