import jwt from "jsonwebtoken";
import CustomError from "../error-handling/customError.js";
import mongoose from "mongoose";
import { getDefaultWarehouse, getNearbyWarehouse } from "../utils/helpers/warehouse.js";
import { clearCookie, setCookie } from "../utils/helpers/cookies.js";

// - Client sends their the coordinates[longitude, latitude] through cookies
// if coordinates aren't present or invalid, server assigns a default warehouse from DB

// OR

// - Find the nearest warehouse of client's location coordinates in DB
//  if unavailable .. Server responds with "Currently unavailable in your area"

//- Sign and store a JWT with a payload containing the nearest warehouse's ID and coordinates

//- For further requests, validates the JWT, if invalid, delete the cookie containing the JWT
// Repeat the process


// Finds nearby warehouse to the clinet and sets cookies for caching the details
export const findNearbyWarehouse = async (req, res, next) => {
    const coords = req.cookies?.coordinates?.split(',');
    const [longitude, latitude] = coords || [];
    const long = Number(longitude);
    const lat = Number(latitude);
    const coordsInvalid = !longitude || !latitude || Number.isNaN(long) || Number.isNaN(lat);

    // Helper to set a JWT cookie
    const setWarehouseCookie = (cookieName, warehouse, coordinates) => {
        const token = jwt.sign(
            { warehouseID: warehouse._id, coordinates },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        setCookie(res, cookieName, token, 15 * 60 * 1000);
    };

    // Helper to verify JWT and call next() after validation
    const verifyJWT = (token, cookieName) => {
        try {
            const result = jwt.verify(token, process.env.JWT_SECRET);
            req.nearbyWarehouse = {
                _id: new mongoose.Types.ObjectId(result.warehouseID),
                location: { coordinates: result.coordinates }
            };
            return true
        }
        catch (err) {
            clearCookie(res, cookieName);
        }
    }

    // Handle denied or invalid coordinates
    if (coordsInvalid) {
        // use existing cookie containing warehouse info
        if (req.cookies.default_w_info) {
            if (verifyJWT(req.cookies.default_w_info, 'default_w_info'));
            return next()
        }

        // assign a default warehouse
        const defaultWarehouse = await getDefaultWarehouse();

        // store in cookies to save DB calls
        setWarehouseCookie(
            'default_w_info',
            defaultWarehouse,
            defaultWarehouse.location.coordinates
        );
        req.nearbyWarehouse = defaultWarehouse;
        return next();
    }

    //  Use existing cookie containing nearby warehouse info
    if (req.cookies.nearby_w_info) {
        if (verifyJWT(req.cookies.nearby_w_info, 'nearby_w_info'));
        return next();
    }

    // query DB for nearby warehouse
    const warehouse = await getNearbyWarehouse({ longitude: long, latitude: lat });
    if (!warehouse) {
        return next(new CustomError('NotFoundError', 'Sorry, we are currently unavailable in your area.', 404));
    }

    // store in cookies to save DB calls
    setWarehouseCookie('nearby_w_info', warehouse, [long, lat]);
    req.nearbyWarehouse = warehouse;
    next();
};
