import { resolveCacheID } from "../utils/cache-helpers.js";

// cache key builders ('<resource>:<cache-key>')

export default {
//   key format for public resources
  publicResources: (queryOrID) => {
    if (!queryOrID) return "unknown";
    return resolveCacheID(queryOrID);
  },

//   key format for private resources
  pvtResources: (userID, queryOrID) => {
    if (!userID || !queryOrID) return "unknown";
    return `${userID}:${resolveCacheID(queryOrID)}`;
  },
};
