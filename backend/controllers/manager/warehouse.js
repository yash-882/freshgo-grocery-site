import WarehouseModel from "../../models/warehouse.js";
import controllerWrapper from "../../utils/controllerWrapper.js";
import sendApiResponse from "../../utils/apiResponse.js";


// Get my warehouse (warehouse_manager)
export const getMyWarehouse = controllerWrapper(async (req, res, next) => {
    const userID = req.user._id;

    const warehouse = await WarehouseModel.findOne({ manager: userID })

    sendApiResponse(res, 200, {
        data: warehouse,
        message: warehouse ? '' : "You don't manage any warehouse yet"
    });
});
