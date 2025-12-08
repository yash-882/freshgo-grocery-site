const { Router } = require('express')

const cartRouter = Router()
const { addToCart, clearCart, getCart, updateCartItemQuantity } = require('../controllers/cart.js');
const { authorizeUser } = require('../middlewares/auths.js');
const findNearbyWarehouse = require('../middlewares/findNearbyWarehouse.js');

// all cart routes require user authorization
cartRouter.use(authorizeUser);

cartRouter.delete('/clear', clearCart) //remove all items from cart

// find nearby warehouse for stock checking
cartRouter.use(findNearbyWarehouse)

cartRouter.get('/', getCart) //get my cart

cartRouter.post('/add', addToCart) //add product to cart

//increment++ or decrement-- item's quantity
cartRouter.patch('/update/:productID/:operation', updateCartItemQuantity)

module.exports = cartRouter;

