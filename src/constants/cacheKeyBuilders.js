const { resolveCacheID } = require("../utils/helpers/cache.js");

// cache key builders ('<resource>:<cache-key>')

const cacheKeyBuilders = {
  //   key format for public resources
  publicResources: (queryOrID) => {
    if (!queryOrID) return "unknown";
    return resolveCacheID(queryOrID);
  },

  //   key format for private resources
  pvtResources: (userID, queryOrID = "SINGLE_RES") => {
    if (!userID) return "unknown";

    return `${userID}:${resolveCacheID(queryOrID)}`;
  },
};

module.exports = cacheKeyBuilders;
