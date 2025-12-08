const mongoose = require("mongoose");

class QueryOperations {

    constructor(query, schemaFields) {
        this.query = {...query}; // incoming query object from client
        this.sortBy = query.sort || '-score'; // default sort
        this.schemaFields = schemaFields; // object of valid document fields(contains Set of fields)
        this.limit = Number(query.limit) || 12 //default limit
        this.skip = Number(query.skip) || 0 //skip
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
            const isInvalidDBField = !this.schemaFields.allFields.has(field) 
            
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

    handle_idField(field){

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

        //add '$' before each operator like ('gt' -> '$gt') for MongoDB query format
        this.query = JSON.stringify(this.query)
            .replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);

        // parsing...
        this.query = JSON.parse(this.query);


          // check for array fields like.  
          // 'category=food&category=bill' (category =['food', 'bill'])
          for (const field in this.query) {
              const fieldValue = this.query[field];
              
              
            if (Array.isArray(fieldValue)) {
                // include '$in' oprator for arrays field 
                // like for category(field)
                //  ['snacks', 'beverages'] --> {category: {"$in": ['snacks','beverages']}}
                
                this.query[field] = { 
                    // convert type to mongoDB document _id
                    "$in": field === '_id' ? 
                    fieldValue.map(id => new mongoose.Types.ObjectId(id)) : fieldValue
                }; 
            }
            
            else if(field === '_id'){
                this.query[field] = new mongoose.Types.ObjectId(fieldValue)
    
            }
        }
        return this.query;
    }

    //Convert sort string to MongoDB-compatible format
    createSortFields() {
        if (!this.sortBy) return;
            

            const fields = this.sortBy.split(",");
            
            // extract valid fields
            const validFields = [...new Set(fields)].filter(f => {
                const fieldName = f.startsWith('-') ? f.slice(1) : f;
                return this.schemaFields.allFields.has(fieldName);
            });
            
            const sortSet = new Set(validFields);
            
            // create sorting fields
            //e.g: '-price', 'createdAt' -> {price: -1, createdAt: 1}

            let sortParams = {};
              [...sortSet].forEach(f => {
                if (f.startsWith('-')) sortParams[f.slice(1)] = -1; //remove prefix '-' and insert
                else sortParams[f] = 1;
            });


            this.sortBy = sortParams;

            // remove fields param from query
            delete this.query.sort; 
        
    }
createSelectFields() {
    if (!this.select) return;

    const fields = this.select.split(',')

    // allow specific field access based on role
    const allowedFields = this.schemaFields.allFields


    // extract valid fields 
    const selectedFields = [...new Set(fields)].filter(f => {
       return f.startsWith('-') ? allowedFields.has(f.slice(1)) : allowedFields.has(f);
    })

    // default
    if(selectedFields.length === 0) {
        this.select = {}
        return;
    }

    // build object for Mongoose .select({ field1: 1, field2: 1 })
    let selectParams = {};
    let isExclusion = selectedFields[0].startsWith('-');

    //becomes true when both inclusion and exclusion(-) fields are mixed together 
    let conflict = false 

    selectedFields.forEach(f => {
        //inclusion and exclusion are mixed!
        if(isExclusion && !f.startsWith('-') || (!isExclusion && f.startsWith('-'))){
             conflict = true 
        } 
        else{
            // apply inclusion or exclusion
            f.startsWith('-') ? selectParams[f.slice(1)] = 0 : selectParams[f] = 1;
        }
    })

    this.select = conflict ? {} : selectParams;

    // remove fields param from query
    delete this.query.select;
}
}

module.exports = QueryOperations;
