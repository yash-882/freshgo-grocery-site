const { getCachedData } = require("../utils/helpers/cache.js");
const sendApiResponse = require("../utils/apiResponse.js");
const cacheKeyBuilders = require("../constants/cacheKeyBuilders.js");

// middleware to get cached products (stored in Redis)
// resourceType can be a product/cart/user/order, etc
const checkCachedData = (resourceType,  isPvtResource=false) => {
  return async (req, res, next) => {
    // query or document ID is used for a uniqueID as a part of Redis key
    let queryOrID;
    

    if(isPvtResource){
      queryOrID = cacheKeyBuilders
     .pvtResources(req.user._id, req.sanitizedQuery || req.params.id)
    } 
    else{
      queryOrID = cacheKeyBuilders
      .publicResources(req.sanitizedQuery || req.params.id || req.originalUrl)
    }

    if (!queryOrID) return next(); // nothing to build cache from

    const cachedData = await getCachedData(queryOrID, resourceType)


    if (!cachedData) {

      req.redisCacheKey = queryOrID; //cache key
      return next();

    }

    // send cached response
    sendApiResponse(res, 200, {data: cachedData });
    console.log('Sent via cache.');
}
}

module.exports = checkCachedData;