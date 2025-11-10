import CustomError from "../error-handling/customError.js";
import controllerWrapper from "../utils/controllerWrapper.js";
import { getManagedWarehouseByUser } from "../utils/helpers/warehouse.js";

// middleware to check if the user manages a warehouse
export const checkManagedWarehouse = controllerWrapper(async (req, res, next) => {
    const managedWarehouse = await getManagedWarehouseByUser(req.user);

    if (!managedWarehouse) {
        return next(new CustomError('ForbiddenError', 'You are not assigned to any warehouse yet.', 403));
    }

    req.managedWarehouse = managedWarehouse;
    next();
});
