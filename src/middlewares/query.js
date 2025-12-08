const QueryOperations = require("../utils/classes/queryOperations.js")


// used to sanitize and create a valid filter{} for MongoDB
const handleQuery = (schemaFields) => {

    return (req, res, next) => {
        const queryParamsLength = Object.keys(req.query).length
        const isSearchQuery = req.path === '/search' && queryParamsLength > 0 && req.query.value
   


        const searchValue = isSearchQuery ? req.query.value : null;

    const operation = new QueryOperations(req.query, schemaFields)

        operation.removeInvalidFields() //remove invalid fields
        operation.createFilter()        //create stuctured filter that MongoDB supports
        operation.createSortFields()    //apply sort fields (if available)

        // restrict sensitive field selection to non-admin roles
        operation.createSelectFields() //apply select fields (if available)


        // sanitized query
        req.sanitizedQuery = {
            filter: operation.query, //actual filter {}
            sort: operation.sortBy, //string or null
            limit: operation.limit,  //number or null
            skip: operation.skip, //number or null
            value: searchValue, //string or null
            select: operation.select //string or null
        }
        next()
    }
}

module.exports = { handleQuery }