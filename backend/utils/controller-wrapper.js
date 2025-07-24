// wraps async API controllers to execute and pass all 
// errors to the global error handler if any occurs
// This is used to avoid try-catch blocks in each controller
 function controllerWrapper(controller) {
     return async (req, res, next) => {
        try {
            // execute controller
            await controller(req, res, next)
        }  
        catch(err){

            // throw error to global error handler
            next(err)
        }
    };
}

export default controllerWrapper;