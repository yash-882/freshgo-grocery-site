// helps getting the next process details
const nextStatusMap = {
    placed: {
        next: 'processing',
        finishesIn: 1000 * 10, // processing will start after 10 seconds
    },  
    processing: {
        next: 'ready_for_pickup',
        finishesIn: 1000 * 20, // processing takes 20 seconds
    },
    ready_for_pickup: {
        next: 'out_for_delivery',
        finishesIn: 1000 * 40, // order gets ready for pickup in 40 seconds
    },
    out_for_delivery: {
        next: 'reached_destination', // delivery takes 1 minute
        finishesIn: 1000 * 60 * 1, 
    },

    // process ends here
    reached_destination: {
        next: null,
        finishesIn: null
    }
}

module.exports = nextStatusMap