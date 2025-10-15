import {Router} from 'express'

const cartRouter = Router()
import { addToCart, clearCart, getCart, updateCartItemQuantity } from '../controllers/cart.js';
import { authorizeUser } from '../middlewares/auths.js';

// all cart routes require user authorization
cartRouter.use(authorizeUser);

cartRouter.route('/')
    .get(getCart) //get my cart
    .post(addToCart) //add product to cart
    .delete(clearCart) //remove all items from cart

//increment++ or decrement-- item's quantity
cartRouter.route('/:productID/:operation')
    .patch(updateCartItemQuantity)

export default cartRouter;

  