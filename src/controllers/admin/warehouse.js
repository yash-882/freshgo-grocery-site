const WarehouseModel = require("../../models/warehouse.js");
const CustomError = require("../../error-handling/customError.js");
const sendApiResponse = require("../../utils/apiResponse.js");
const UserModel = require("../../models/user.js");
const mongoose = require("mongoose");
const ProductModel = require("../../models/product.js");

// Create a new warehouse (admin only)
const createWarehouse = async (req, res, next) => {
    const warehouseData = req.body;
    const newWarehouse = await WarehouseModel.create(warehouseData);

    sendApiResponse(res, 201, {
        message: 'Warehouse created successfully',
        data: newWarehouse,
    });
}


// Get all warehouses (admin only)
const getWarehouses = async (req, res, next) => {
    const { filter, sort, limit, skip, select } = req.sanitizedQuery;

    const warehouses = await WarehouseModel.find(filter)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .select(select)
        .populate({
            path: 'manager',
            select: 'name email -_id',
        });

    sendApiResponse(res, 200, {
        data: warehouses,
    });
}

// Get warehouse by ID (admin only)
const getWarehouseByID = async (req, res, next) => {
    const warehouseID = req.params.id;

    const warehouse = await WarehouseModel.findById(warehouseID)
        .populate({
            path: 'manager',
            select: 'name email -_id',
        });

    if (!warehouse) {
        return next(new CustomError('NotFoundError', 'Warehouse not found', 404));
    }

    sendApiResponse(res, 200, {
        data: warehouse,
    });
}

// Update warehouse by ID(admin only)
const updateWarehouseByID = async (req, res, next) => {
    const warehouseID = req.params.id;
    const updates = req.body || {};


    // Ensure managerId is not updated directly here to prevent unauthorized manager changes
    if (updates.manager) {
        return next(
            new CustomError('BadRequestError', 'Manager cannot be updated directly through this endpoint. Please use the manager assignment endpoint.', 400));
    }

    // set updates for nested fields
    if (updates.location) {
        Object.keys(updates.location).forEach(key => {
            updates[`location.${key}`] = updates.location[key];
        });
        delete updates.location;
    }
    if (updates.coordinates) {
        updates['location.coordinates'] = updates.coordinates;
        delete updates.coordinates;
    }


    const updatedWarehouse = await WarehouseModel.findByIdAndUpdate(warehouseID, { $set: updates }, {
        new: true,
        runValidators: true,
    })

    if (!updatedWarehouse) {
        return next(new CustomError('NotFoundError', 'Warehouse not found', 404));
    }

    sendApiResponse(res, 200, {
        message: 'Warehouse updated successfully',
        data: updatedWarehouse,
    });
}

// Assign manager to a warehouse (admin only)
const assignManagerToWarehouse = async (req, res, next) => {
    const warehouseID = req.params.id;
    const { managerID } = req.body;

    if (!managerID) {
        return next(new CustomError('BadRequestError', 'Manager ID is required', 400));
    }

    // get the manager and warehouse
    const manager = await UserModel.findById(managerID);
    const warehouse = await WarehouseModel.findById(warehouseID);

    if (!manager || !warehouse) {
        return next(
            new CustomError('NotFoundError', `${manager ? 'Warehouse' : 'Manager'} not found`, 404));
    }

    // Check if the warehouse already has a manager
    if (warehouse.manager) {
        return next(new CustomError('BadRequestError', 'Warehouse already has a manager', 400));
    }

    // Check if manager is already assigned to another warehouse
    const existingWarehouse = await WarehouseModel.findOne({ manager: managerID });
    if (existingWarehouse) {
        return next(new CustomError('BadRequestError', `Manager is already assigned to warehouse ${existingWarehouse.name}`, 400));
    }

        // Add the warehouse to the manager's warehouses array
       const updatedWarehouse = await WarehouseModel.findByIdAndUpdate(
            warehouseID,
            { manager: managerID },
            { new: true, runValidators: true }
        );


    sendApiResponse(res, 200, {
        message: 'Manager assigned to warehouse successfully',
        data: updatedWarehouse,
    });
}

// Remove manager from a warehouse (admin only)
const removeManagerFromWarehouse = async (req, res, next) => {
    const warehouseID = req.params.id;
    const { managerID } = req.body; // Manager ID to remove

    if (!managerID) {
        return next(new CustomError('BadRequestError', 'Manager ID is required', 400));
    }

    const updatedWarehouse = await WarehouseModel.findByIdAndUpdate(
        warehouseID,
        { $set: { manager: null } }, // Set manager to null
        { new: true, runValidators: true }
    );

    if (!updatedWarehouse) {
        return next(new CustomError('NotFoundError', 'Warehouse not found', 404));
    }

    // Remove the warehouse from the manager's warehouses array
    await UserModel.findByIdAndUpdate(managerID, { $pull: { warehouses: warehouseID } });

    sendApiResponse(res, 200, {
        message: 'Manager removed from warehouse successfully',
        data: updatedWarehouse,
    });
}

// Delete warehouse by ID (admin only)
const deleteWarehouseByID = async (req, res, next) => {
    const warehouseID = req.params.id;

    let session;
    let deletedWarehouse;

    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            deletedWarehouse = await WarehouseModel.findByIdAndDelete(warehouseID, { session });

            if (!deletedWarehouse) {
                throw new CustomError('NotFoundError', 'Warehouse not found', 404);
            }

            // Remove the warehouse from all products that reference it
            await ProductModel.updateMany(
                { 'warehouses.warehouse': warehouseID },
                { $pull: { warehouses: { warehouse: warehouseID } }, byAdmin: true},
                { session }
            );
        });

        sendApiResponse(res, 200, {
            message: 'Warehouse deleted successfully',
            data: deletedWarehouse,
        });
    } catch (error) {
        next(error);
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

module.exports = { createWarehouse, getWarehouses, getWarehouseByID, updateWarehouseByID, assignManagerToWarehouse, removeManagerFromWarehouse, deleteWarehouseByID }