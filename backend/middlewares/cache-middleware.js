import { getCachedData } from "../utils/cache-helpers.js";
import sendApiResponse from "../utils/api-response.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import cacheKeyBuilders from "../constants/cache-key-builders.js";

// middleware to get cached products (stored in Redis)
// resourceType can be a product/cart/user/order, etc
export const checkCachedData = (resourceType,  isPvtResource=false) => {

  return controllerWrapper(async (req, res, next) => {
    // query or document ID is used for a uniqueID as a part of Redis key
    let queryOrID;
    

    if(isPvtResource){
      queryOrID = cacheKeyBuilders
     .pvtResources(req.user._id, req.sanitizedQuery || req.params.id)
    } 
    else{
      queryOrID = cacheKeyBuilders
      .publicResources(req.sanitizedQuery || req.params.id)
    }

    if (!queryOrID) return next(); // nothing to build cache from

    const cachedData = await getCachedData(queryOrID, resourceType)


    if (!cachedData) return next();

    // send cached response
    sendApiResponse(res, 200, {data: cachedData });
})
}