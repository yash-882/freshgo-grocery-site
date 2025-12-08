const { isPlainObject, sortObjectKeys } = require("./object.js");
const RedisService = require("../classes/redisService.js");
const { createHash } = require("crypto");

// build a unique cache identifier for queries (e.g: sort=price&price[gt]=50)
const generateQueryHash = (query = {}) => { 
  const filter = { 
    ...query.filter || {}
  }

  const { sort, limit, skip, select } = query;

  // merge properties
  Object.assign(filter, { sort, limit, skip, select });

  // sort keys to prevent cache misses due to different key ordering
  // (skip sorting keys for search resource requests)
  const sortedFilter = query.value ? query : sortObjectKeys(filter);

   // generate hash for query string (reason: query strings can be too lengthy as a Redis key)
  return createHash("md5").update(JSON.stringify(sortedFilter)).digest("hex");
};

// reusable helper for cacheID
const resolveCacheID = (queryOrId) => {
  if (queryOrId && isPlainObject(queryOrId) && Object.keys(queryOrId).length > 0) {
    return generateQueryHash(queryOrId);
  }
  return String(queryOrId || "unknown");
}

// CACHE CRUD:

// store data in Redis with TTL (default 5 mins)
const storeCachedData = async (
  queryOrId,
  { data, ttl = 300 },
  resourceType,
  isUpdate = false
) => {
  const CacheStore = new RedisService(`${resourceType}:${queryOrId}`, "DATA_CACHE");
  await CacheStore.setShortLivedData(data, ttl, isUpdate);
};

// get cached data
const getCachedData = async (queryOrId, resourceType) => {
  const CacheStore = new RedisService(`${resourceType}:${queryOrId}`, "DATA_CACHE");
  return await CacheStore.getData();
};

// delete cached data
const deleteCachedData = async (queryOrId, resourceType) => {
  const CacheStore = new RedisService(`${resourceType}:${queryOrId}`, "DATA_CACHE");
  await CacheStore.deleteData(CacheStore.getKey());
};

module.exports = { generateQueryHash, resolveCacheID, storeCachedData, getCachedData, deleteCachedData };