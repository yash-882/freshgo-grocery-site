import {Router} from 'express'

const cartRouter = Router()
import { addToCart, clearCart, getCart, updateCartItemQuantity } from '../controllers/cart.js';
import { authorizeUser } from '../middlewares/auths.js';
import { findNearbyWarehouse } from '../middlewares/findNearbyWarehouse.js';

// all cart routes require user authorization
cartRouter.use(authorizeUser);

cartRouter.delete('/clear', clearCart) //remove all items from cart

// find nearby warehouse for stock checking
cartRouter.use(findNearbyWarehouse)

cartRouter.get('/', getCart) //get my cart

cartRouter.post('/add', addToCart) //add product to cart

//increment++ or decrement-- item's quantity
cartRouter.patch('/update/:productID/:operation', updateCartItemQuantity)

export default cartRouter;

  