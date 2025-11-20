import { resolveCacheID } from "../utils/helpers/cache.js";

// cache key builders ('<resource>:<cache-key>')

export default {
//   key format for public resources
  publicResources: (queryOrID) => {
    if (!queryOrID) return "unknown";
    return resolveCacheID(queryOrID);
  },

//   key format for private resources
  pvtResources: (userID, queryOrID='SINGLE_RES') => {
    if (!userID) return "unknown";

    return `${userID}:${resolveCacheID(queryOrID)}`;
  },
};
