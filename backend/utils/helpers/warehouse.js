import WarehouseModel from "../../models/warehouse.js";

export const getManagedWarehouseByUser = async (user) => {
    // Find warehouses managed by this user(warehouse_manager)
      const managedWarehouses = await WarehouseModel.findOne({ manager: user._id }).select('_id');
      return managedWarehouses
}