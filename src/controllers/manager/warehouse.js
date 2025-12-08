const WarehouseModel = require("../../models/warehouse.js");
const sendApiResponse = require("../../utils/apiResponse.js");

// Get my warehouse (warehouse_manager)
const getMyWarehouse = async (req, res, next) => {
    const userID = req.user._id;

    const warehouse = await WarehouseModel.findOne({ manager: userID })

    sendApiResponse(res, 200, {
        data: warehouse,
        message: warehouse ? '' : "You don't manage any warehouse yet"
    });
}

module.exports = { getMyWarehouse }
