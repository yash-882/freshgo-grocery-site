import QueryOperations from "../utils/query-operations.js"


// used to sanitize and create a valid filter{} for MongoDB
export const handleQuery = (schemaFields, isAdmin = false) => {

    return (req, res, next) => {
        const queryParamsLength = Object.keys(req.query).length
        const isSearchQuery = req.path === '/search' && queryParamsLength === 1 && req.query.value

        // skip processing if no query params are provided or for search requests
        if(queryParamsLength === 0 || isSearchQuery){

            // default query
            req.sanitizedQuery = {
            value: isSearchQuery ? req.query.value : undefined,
            filter: {}, //actual filter {}
            sort: { score: -1, inStock: -1}, //default
            limit: 10,  //default
            skip: null, //number or null
            select: null //string or null
        }

        return next()
    }
        

        const operation = new QueryOperations(req.query, schemaFields)

        operation.removeInvalidFields() //remove invalid fields
        operation.createFilter()        //create stuctured filter that MongoDB supports
        operation.createSortFields()    //apply sort fields (if available)

        // restrict sensitive field selection to non-admin roles
        operation.createSelectFields(isAdmin) //apply select fields (if available)

        // sanitized query
        req.sanitizedQuery = {
            filter: operation.query, //actual filter {}
            sort: operation.sortBy, //string or null
            limit: operation.limit,  //number or null
            skip: operation.skip, //number or null
            select: operation.select //string or null
        }
        next()
    }
}