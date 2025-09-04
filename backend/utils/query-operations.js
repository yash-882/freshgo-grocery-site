class QueryOperations {

    constructor(query, schemaFields) {
        this.query = {...query}; // incoming query object from client
        this.sortBy = query.sort || '-createdAt'; // default sort
        this.schemaFields = schemaFields; // object of valid document fields(contains Set of fields)
        this.limit = Number(query.limit) || 10 //default limit
        this.skip = Number(query.skip) || null //skip
        this.select = query.select || null; //select
    }

    // removes invalid fields that are not part of the schema or contain empty/falsy values
    removeInvalidFields() {
        Object.keys(this.query).forEach(field => {
            // check is the key is assigned with an empty value/array/obj/ or undefined
            const isEmptyStr = typeof this.query[field] === 'string' && this.query[field].trim() === '';
            const isEmptyObject = typeof this.query[field] === 'object' && this.query[field] !== null && Object.keys(this.query[field]).length === 0;
            const isEmptyArray = Array.isArray(this.query[field]) && this.query[field].length === 0;
            const isFalsy = this.query[field] === undefined || this.query[field] === null;
            const isInvalidDBField = !this.schemaFields.allFields.has(field);


            // if the field contains falsy value
            if (isInvalidDBField || isEmptyStr || isEmptyObject || isEmptyArray || isFalsy)
                delete this.query[field];
        })
    }

    // return true if the tested value is Number ("123"->true , "sh3" or "shh"->false)
    // boolean values are also restricted
    canConvertToNumber(num) {
        const numRegex = /^\s*-?(?:\d+|\d*\.\d+)\s*$/;
        return numRegex.test(num);
    }

    changeToNumeric(field) {
        const allowedOperators = new Set(['gt', 'gte', 'lt', 'lte', 'in']);

        // check if the field is an obj, e.g ({gte: "20"})
        const isObject = 
        typeof this.query[field] === 'object' && 
        this.query[field] !== null && 
        !Array.isArray(this.query[field]);
        
        if (isObject) {

            Object.entries(this.query[field]).forEach(([operator, value]) => {
    

                // valid it is a valid operator and eligible for number conversion 
                if (allowedOperators.has(operator)
                    &&
                    this.canConvertToNumber(value)) {
                    this.query[field][operator] = Number(value); //change datatype to number
                }

                // delete the invalid field
                else
                    delete this.query[field][operator];
            })

            // If no valid operators left, drop the whole field
            if (Object.keys(this.query[field]).length === 0) {
                delete this.query[field];
            }
        }

        // check if the field is an obj, e.g ({gte: "20"})
        else if (Array.isArray(this.query[field])) {
            // check for array fields like.  
            // 'category=food&category=bill'(category =['food', 'bill])

            const numericFields = this.query[field]
                .filter(value => this.canConvertToNumber(value)) //keep only valid numbers
                .map(value => Number(value))

            // store valid array of values
            if (numericFields.length > 0) {
                this.query[field] = numericFields;
            } else {
                delete this.query[field]; //no valid value found, drop the array field
            }
        }

        // its a primitive value
        else {
            if (this.canConvertToNumber(this.query[field])) {
                this.query[field] = Number(this.query[field]);
            }
            else
                delete this.query[field];
        }
    }

    createFilter() {

        // clean up query string for invalid fields
        this.removeInvalidFields();

        const numericFields = [...this.schemaFields.numericFields]

        // check for numeric fields and convert to a number datatype
        for (const numericField of [...numericFields]) {
            if (this.query.hasOwnProperty(numericField)) {
                
                this.changeToNumeric(numericField)
            }
        }

        // check for array fields like.  
        // 'category=food&category=bill' (category =['food', 'bill'])

        for (const field in this.query) {
            const fieldValue = this.query[field];


            if (Array.isArray(fieldValue)) {
                // include '$in' oprator for arrays field 
                // like for category(field)
                //  ['snacks', 'beverages'] --> {category: {"$in": ['snacks','beverages']}}
                this.query[field] = { "$in": fieldValue };
            }
        }

        //add '$' before each operator like ('gt' -> '$gt') for MongoDB query format
        this.query = JSON.stringify(this.query)
            .replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);

        // parsing...
        this.query = JSON.parse(this.query);

        return this.query;
    }

    //Convert sort string to MongoDB-compatible format
    createSortFields() {
        if (this.sortBy) {
            const fields = this.sortBy.split(",");
            const sortSet = new Set(fields);

            // ensure -createdAt fallback
            if (![...sortSet].some((f) => f.includes("createdAt"))) {
                sortSet.add("-createdAt");
            }

            this.sortBy = [...sortSet].join(" ");
        }
    }
     createSelectFields(isAdmin) {
        const selectParams = this.select;

        
        if(selectParams){
            let selectedFields;
            
            if (isAdmin) {
                // convert comma-separated string to array
                selectedFields = selectParams.split(',')
                .filter(f => this.schemaFields.allFields.has(f));
            } else {
                // if not provided, use selectable fields
                    selectedFields = selectParams.split(',')
                .filter(f => this.schemaFields.selectableFields.has(f));
            }

            selectedFields.join(' ')

            // build string for Mongoose .select()
            this.select = selectedFields.join(' ');
    
            // remove fields param from query
            delete this.query.select;
        }

    }

}

export default QueryOperations;
