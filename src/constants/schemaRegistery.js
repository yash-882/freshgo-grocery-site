const ProductModel = require("../models/product.js")
const OrderModel = require("../models/order.js");
const UserModel = require("../models/user.js");
const schemaFieldHelpers = require("../utils/helpers/schemaField.js");
const WarehouseModel = require("../models/warehouse.js");

// Stores schema definitions with categorized fields
const schemaRegistery = {
    // 'product' schema fields
  product: {
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(ProductModel.schema.paths, ['quantity']),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(ProductModel.schema.paths, ['score', 'quantity']),

  },

  order:{
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(OrderModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(OrderModel.schema.paths),
  },

  // used by Admin only 
  user: {
     // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(UserModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(UserModel.schema.paths),

  },
  warehouse: {
    // numeric fields
    numericFields: schemaFieldHelpers.getNumericFields(WarehouseModel.schema.paths),

    // all fields
    allFields: schemaFieldHelpers.getAllFields(WarehouseModel.schema.paths),
    
  }
};

module.exports = { schemaRegistery }


