
// generates schema fields for different use cases (numeric, all, selectable)
export const schemaFieldHelpers = {

    // extracts numeric fields of Mongoose schema
  getNumericFields(schemaPaths, customAllowedFields=[]) {
    if (!schemaPaths) return [];


    const numericFields = Object.entries(schemaPaths)
      .filter(([_, schemaType]) => schemaType.instance === "Number")
      .map(([f, _]) => f);

      return new Set([...numericFields, ...customAllowedFields])
  },

//   get all fields of Mongoose schema
  getAllFields(schemaPaths, customAllowedFields=[]) {
    if (!schemaPaths) return [];

    const allFields = Object.keys(schemaPaths).filter(f => f !== "__v");

    return new Set([...allFields, ...customAllowedFields]) //all fields except '__v'
  },
};