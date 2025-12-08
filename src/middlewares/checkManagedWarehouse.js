const CustomError = require("../error-handling/customError.js");
const { getManagedWarehouseByUser } = require("../utils/helpers/warehouse.js");

// middleware to check if the user manages a warehouse
const checkManagedWarehouse = async (req, res, next) => {
    const managedWarehouse = await getManagedWarehouseByUser(req.user);

    if (!managedWarehouse) {
        return next(new CustomError('ForbiddenError', 'You are not assigned to any warehouse yet.', 403));
    }

    req.managedWarehouse = managedWarehouse;
    next();
}

module.exports = checkManagedWarehouse;
