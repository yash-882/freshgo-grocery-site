
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
  getAllFields(schemaPaths) {
    if (!schemaPaths) return [];

    const allFields = Object.keys(schemaPaths).filter(f => f !== "__v");

    return new Set(allFields) //all fields except '__v'
  },

//   extracts only allowed fields for selection
  getSelectableFields(schemaPaths, nonSelectableFields=[], customAllowedFields=[]){
    if (!schemaPaths) return [];

    const selectableFields = Object.keys(schemaPaths)
    .filter(f => !nonSelectableFields.includes(f));

    return new Set([...selectableFields, ...customAllowedFields])
  }
};