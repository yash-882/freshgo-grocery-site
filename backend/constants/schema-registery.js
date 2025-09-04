import ProductModel from "../models/product-model.js"
import UserModel from "../models/user-model.js";
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

  // used by Admin only
  user: {
     // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(UserModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(UserModel.schema.paths),

    // selectable fields (Admin only: no fields are restricted to select)
    selectableFields: schemaFieldHelpers
    .getSelectableFields(UserModel.schema.paths)
  }
};


