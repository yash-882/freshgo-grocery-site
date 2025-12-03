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
            priceAtPurchase: {
                type: Number,
                required: true,
                min: [0, 'Price cannot be negative']
            }
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',        
        required: [true, 'User ID is required'],
    },
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'warehouse',
        required: [true, 'Warehouse ID is required']
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
    razorpayOrderID: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    orderStatus: {
        type: String,
        enum: {
            values: 
            ['pending', 'placed', 'processing', 'ready_for_pickup', 'delivered', 'cancelled', 'out_for_delivery', 'reached_destination'],
            message: '{VALUE} is not a valid order status'
        },
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'refunded', 'failed'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['card', 'upi', 'cash_on_delivery', 'netbanking'],
            message: 'Invalid payment method!'
        },
        
        required: [true, 'Payment method is required']
    },

    expectedDeliveryAt: {
        type: Date,
        default: null
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

// readable date of delivery
OrderSchema.virtual('readableDeliveryTime').get(function() {
    const date = this.expectedDeliveryAt;
    if (!date) return '';

    // Indian format (in deployement, the server could be hosted in different region)

    // Get IST offset in milliseconds (UTC+5:30 = 19800000ms)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    
    // Convert to IST by adjusting the UTC time
    const istTime = new Date(date.getTime() + IST_OFFSET);
    const nowISTTime = new Date(Date.now() + IST_OFFSET);

    // Check if it's today in IST (compare UTC representations of IST dates)
    const isToday =
        istTime.getUTCDate() === nowISTTime.getUTCDate() &&
        istTime.getUTCMonth() === nowISTTime.getUTCMonth() &&
        istTime.getUTCFullYear() === nowISTTime.getUTCFullYear();

    // Format time in IST
    const timeString = date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });

    if (isToday) {
        return `Today, ${timeString}`;
    }

    // Format date in IST
    const dateString = date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
    });

    return `${dateString}, ${timeString}`;
});

const OrderModel = model('order', OrderSchema)

export default OrderModel