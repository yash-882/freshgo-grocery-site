import ProductModel from "../models/product-model.js"
import { schemaFieldHelpers } from "../utils/schema-field-helpers.js";

// Stores schema definitions with categorized fields
export const schemaRegistery = {
    // 'product' schema fields
  product: {
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(ProductModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(ProductModel.schema.paths),

    // selectable fields
    selectableFields: schemaFieldHelpers
    .getSelectableFields(ProductModel.schema.paths, ['seller', 'score'])
  },
};


