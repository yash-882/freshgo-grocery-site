// sort object keys alphabetically
const sortObjectKeys = (filter) => {
  return Object.keys(filter || {})
    .sort()
    .reduce((sortedFilter, key) => {
      if (filter[key] !== undefined && filter[key] !== null) {
        sortedFilter[key] = filter[key];
      }
      return sortedFilter;
    }, {});
}

// checks if the given value is a plain object (not an array or null)
const isPlainObject = (obj) => 
    typeof obj === 'object' && obj !== null && !Array.isArray(obj);

module.exports = { sortObjectKeys, isPlainObject };