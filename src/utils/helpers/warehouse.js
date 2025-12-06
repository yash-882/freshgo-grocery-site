import WarehouseModel from "../../models/warehouse.js";

export const getManagedWarehouseByUser = async (user) => {
    // Find warehouses managed by this user(warehouse_manager)
      const managedWarehouses = await WarehouseModel.findOne({ manager: user._id }).select('_id');
      return managedWarehouses
}

export const getNearbyWarehouse = async ({longitude, latitude}) => {
      // get the warehouse nearest to user
    return await WarehouseModel.findOne({
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [longitude, latitude] },
                $maxDistance: 1_000_000 //1000KM
            }
        }
    }).select('_id location.coordinates');
}

// Get default warehouse when the client's location is not accessible
export const getDefaultWarehouse = async () => 
     await WarehouseModel.findById(process.env.DEFAULT_WAREHOUSE_ID);

