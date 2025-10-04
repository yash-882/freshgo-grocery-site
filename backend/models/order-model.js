import {Schema, model} from 'mongoose'

// order now -> cart cleared -> show payment methods -> ...
// -> make payment using one method -> processing payment

// successful flow✅
// payment successful -> decrease quantity of product(s) -> create order in DB -> set status to pending -> further process ->
// order delivered -> done

// order cancelled before/on the delivery❌
// undo the product quantity -> mark order as 'cancelled' in DB


// order management 
const OrderSchema = new Schema({
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
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',        
        required: [true, 'User ID is required'],
    },
    shippingAddress: {
        street: { 
            type: String, 
            required: [true, 'Street is required'] 
        },
        city: { 
            type: String, 
            required: [true, 'City is required'] 
        },
        state: { 
            type: String, 
            required: [true, 'State is required'] 
        },
        pinCode: { 
            type: String, 
            required: [true, 'Pin code is required'],
            minlength: [6, 'Invalid pin code'],
            maxlength: [6, 'Invalid pin code']
        },
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    orderStatus: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            message: '{VALUE} is not a valid order status'
        },
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'refunded'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['credit_card', 'upi', 'cash_on_delivery', 'net_banking'],
            message: 'Invalid payment method!'
        },
        
        required: [true, 'Payment method is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, 
{ 
    toJSON: { virtuals: true }, toObject: { virtuals: true }
})


// sum of all products including their quantities 
OrderSchema.virtual('totalItemsQuantity',).get(function(){
    return this.products.reduce((totalItems, item) => totalItems + item.quantity, 0)
})

// unique product
OrderSchema.virtual('totalItems').get(function() {
    return this.products.length;
})

const OrderModel = model('order', OrderSchema)

export default OrderModel