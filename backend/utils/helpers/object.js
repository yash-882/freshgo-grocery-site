// sort object keys alphabetically
export const sortObjectKeys = (filter) => {
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
export const isPlainObject = (obj) => 
    typeof obj === 'object' && obj !== null && !Array.isArray(obj);