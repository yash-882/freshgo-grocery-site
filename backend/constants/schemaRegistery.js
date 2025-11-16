import ProductModel from "../models/product.js"
import OrderModel from "../models/order.js";
import UserModel from "../models/user.js";
import { schemaFieldHelpers } from "../utils/helpers/schemaField.js";
import WarehouseModel from "../models/warehouse.js";

// Stores schema definitions with categorized fields
export const  schemaRegistery = {
    // 'product' schema fields
  product: {
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(ProductModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(ProductModel.schema.paths),

    // selectable fields
    selectableFields: schemaFieldHelpers
    .getSelectableFields(ProductModel.schema.paths, ['score'])
  },

  order:{
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(OrderModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(OrderModel.schema.paths),

    // selectable fields
    selectableFields: schemaFieldHelpers
    .getSelectableFields(OrderModel.schema.paths, ['user', 'products'])
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
  },
  warehouse: {
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(WarehouseModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(WarehouseModel.schema.paths),

    // selectable fields
    selectableFields: schemaFieldHelpers
    .getSelectableFields(WarehouseModel.schema.paths)
    
  }
};


