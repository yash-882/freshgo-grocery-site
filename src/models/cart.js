const { Schema, model } = require('mongoose');

const CartSchema = new Schema({
    // multiple products
    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'product',
                required: [true, 'Product ID is required']
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be greater than 0'],
                default: 1

            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    
    // cart owner
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'User ID is required'],
        unique: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

// calculates the total amount of the cart
CartSchema.methods.getSummary = function(products=[]){
    // cart is empty
    if(products.length === 0)
        return;

    const cartSummary = products.reduce((cartSummary, item) => {

        // exclude out of stock products
        if(item.product.inStock === false || item.product.quantity === 0)
            return cartSummary

        // calculate total price and add to cartSummary
        cartSummary.cartTotal += item.product.price * item.quantity
        return cartSummary

    }, {cartTotal: 0, deliveryCharges: 0, grandTotal: 0})

    // apply delivery charges if the total price is lower than to the given amount 
    if(cartSummary.cartTotal < 200){
        cartSummary.deliveryCharges = 50
    }
    
    // grand total
    cartSummary.grandTotal = cartSummary.cartTotal + cartSummary.deliveryCharges

    return {
        totalItems: products.filter(item => item.product.inStock === true && item.product.quantity > 0).length,
        cartTotal: Number((cartSummary.cartTotal).toFixed(2)),
        cartTotal: Number((cartSummary.cartTotal).toFixed(2)),
        deliveryCharges: cartSummary.deliveryCharges,
        grandTotal: Number((cartSummary.cartTotal + cartSummary.deliveryCharges).toFixed(2))
    }
}



const CartModel = model('cart', CartSchema)

module.exports = CartModel;