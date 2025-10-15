import mongoose from "mongoose";
import OrderModel from "../../models/order.js";
import controllerWrapper from "../../utils/controllerWrapper.js";
import sendApiResponse from "../../utils/apiResponse.js";
import CustomError from "../../error-handling/customError.js";


// dashboard for seller-----------------------------

// revenue stats
export const revenueStats = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id; //current seller
    const { time } = req.query;

    // avoid invalid value
    if(time && !(['year_to_date', 'last_30_days'].includes(time))){
        return next(
            new CustomError('BadRequestError', 
                'Invalid time parameter. Use "year_to_date" for this year or "last_30_days" for last 30 days.', 400));
    }

  // All time revenue / this year revenue / last 30 days revenue
    const filter = {
        orderStatus: 'delivered',
        'productDetails.seller': new mongoose.Types.ObjectId(userID)
    };

    switch(time){
        case 'year_to_date':
            const currentYear = new Date().getFullYear();
            filter.createdAt = {
                $gte: new Date(currentYear, 0, 1)  // (01 Jan to current date)

            }
            break;
        case 'last_30_days':
            const last30DaysStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filter.createdAt = {
                $gte: last30DaysStart  // in last 30 days 
            }
            break;
    }

    const [revenueStats] = await OrderModel.aggregate([
          // unwind the products array to work with individual items
          {
              $unwind: '$products'
          },
  
          // lookup to get product details including seller information
          {
              $lookup: {
                  from: 'products',
                  localField: 'products.product',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
  
          // unwind the productDetails array
          {
              $unwind: '$productDetails'
          },
  
          // filter only delivered orders
          {
              $match: filter
          },
  
          // calculate revenue per item
          {
              $addFields: {
                  itemRevenue: {
                      $multiply: ['$products.quantity', '$products.priceAtPurchase']
                  }
              }
          },
  
          // group by seller and sum up total revenue
          {
              $group: {
                  _id: '$productDetails.seller',
                  totalRevenue: { $sum: '$itemRevenue' },
                  totalOrders: { $sum: 1 },
                  totalItemsSold: { $sum: '$products.quantity' }
              }
          },
  
          {
              $project: {
                  _id: 0,
                  totalRevenue: 1,
                  totalOrders: 1,
                  totalItemsSold: 1
              }
          }
      ])


  sendApiResponse(res, 200, {
    data: {
        totalRevenue: revenueStats?.totalRevenue || 0,
        totalOrders: revenueStats?.totalOrders || 0,
        totalItemsSold: revenueStats?.totalItemsSold || 0
    }
    
  });
})

// top 5 selling products of a seller
export const topFiveSellingProducts = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id; //current seller

    const topFiveSellingProducts = await OrderModel.aggregate([
        // unwind the products array to work with individual items
        {
            $unwind: '$products'
        },

        // lookup to get product details including seller information
        {
            $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },

        // unwind the productDetails array
        {
            $unwind: '$productDetails'
        },

        // filter only delivered orders
        {
            $match: {
                orderStatus: 'delivered',
                'productDetails.seller': new mongoose.Types.ObjectId(userID)  // or just sellerID if it's already ObjectId

            }
        },

        // group docs to calculate quantity
        {
            $group: {
                _id: '$productDetails._id',
                priceAtPurchase: { $first: '$products.priceAtPurchase' },
                totalSold: { $sum: '$products.quantity' },
                productName: { $first: '$productDetails.name' },
                productPrice: { $first: '$productDetails.price' },
                productCategory: { $first: '$productDetails.category' }
            }
        },
        {
            $addFields: {
                revenue: {
                    $multiply: ['$totalSold', '$priceAtPurchase']
                },
                product: {
                    _id: '$_id',
                    name: '$productName',
                    price: '$productPrice',
                    category: '$productCategory'
                }
            }

        },
        {
            $project: {
                _id: 0,
                product: 1,
                totalSold: 1,
                revenue: 1
            }
        },

        // sort by quantity (descending order)
        {
            $sort: {
                totalSold: -1
            }
        },

        // limit 5 products
        {
            $limit: 5
        },

    ])



  sendApiResponse(res, 200, {
    data: {
        topFiveSellingProducts: topFiveSellingProducts || []
    }  
  })
})


// category-wise stats 
export const categoryStats = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id; //current seller
    const { time } = req.query;

     // avoid invalid value
    if(time && !(['year_to_date', 'last_30_days'].includes(time))){
        return next(
            new CustomError('BadRequestError', 
                'Invalid time parameter. Use "year_to_date" for this year or "last_30_days" for last 30 days.', 400));
    }

  // All time revenue / this year revenue / last 30 days revenue
    const filter = {
        orderStatus: 'delivered',
        'productDetails.seller': new mongoose.Types.ObjectId(userID)
    };

    switch(time){
        case 'year_to_date':
            const currentYear = new Date().getFullYear();
            filter.createdAt = {
                $gte: new Date(currentYear, 0, 1)  // (01 Jan to current date)

            }
            break;
        case 'last_30_days':
            const last30DaysStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filter.createdAt = {
                $gte: last30DaysStart  // in last 30 days 
            }
            break;
    } 

    const categoryStats = await OrderModel.aggregate([
        // unwind the products array to work with individual items
        {
            $unwind: '$products'
        },

        // lookup to get product details including seller information
        {
            $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },

        // unwind the productDetails array
        {
            $unwind: '$productDetails'
        },

        // filter only delivered orders
        {
            $match: filter
        },

        // group by category and sum up total items sold and revenue
        {
            $group: {
                _id: '$productDetails.category',
                totalItemsSold: { $sum: '$products.quantity' },
                totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.priceAtPurchase'] } }
            }
        },

        // project to rename _id to category and include other fields
        {
            $project: {
                _id: 0,
                category: '$_id',
                totalItemsSold: 1,
                totalRevenue: 1
            }
        },

        // sort by total revenue in descending order
        {
            $sort: {
                totalRevenue: -1
            }
        }
    ]);

    sendApiResponse(res, 200, {
        data: {
            categoryStats: categoryStats || []
        }
    });
})

// this month vs last month
export const revenueComparison = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id; //current seller
    const { comparison } = req.params;
    // last_30_days -> last 30 days revenue vs 30 days of previous 30 days
    // year_to_date -> this year to date (YTD) vs previous year

    if(!(['last_30_days', 'year_to_date'].includes(comparison))){
    return next(
        new CustomError('BadRequestError', 
            'Invalid time. Use "year_to_date" or "last_30_days" for comparisons.', 400));
}

    const filter = {
        orderStatus: 'delivered',
        'productDetails.seller': new mongoose.Types.ObjectId(userID)
    };
    const comparisonFilter = { ...filter };

    const now = Date.now();
    const currentYear = new Date().getFullYear();

    switch (comparison) {
        case 'year_to_date':
            // current year (1 Jan to today's date)
            filter.createdAt = {
                $gte: new Date(currentYear, 0, 1)  // Jan 1, current year
            };
            // previous full year (Jan 1 to Dec 31 of last year)
            comparisonFilter.createdAt = {
                $gte: new Date(currentYear - 1, 0, 1),  // Jan 1, previous year
                $lt: new Date(currentYear, 0, 1)         // Before Jan 1, current year
            };
            break;

        case 'last_30_days':

            const last30DaysStart = new Date(now - 30 * 24 * 60 * 60 * 1000);
            const last60DaysStart = new Date(now - 60 * 24 * 60 * 60 * 1000);

            // last 30 days
            filter.createdAt = {
                $gte: last30DaysStart
            };
            // days 31-60 (previous 30 days)
            comparisonFilter.createdAt = {
                $gte: last60DaysStart,
                $lt: last30DaysStart
            };
            break;
    }

    const [currentTimeRevenue, previousTimeRevenue] = await Promise.all([
        // last 30 days
        OrderModel.aggregate([
            // unwind the products array to work with individual items
            {
                $unwind: '$products'
            },

            // lookup to get product details including seller information
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },

            // unwind the productDetails array
            {
                $unwind: '$productDetails'
            },

            // filter only delivered orders
            {
                $match: filter,
                   
                
            },

            // calculate revenue per item
            {
                $addFields: {
                    itemRevenue: {
                        $multiply: ['$products.quantity', '$products.priceAtPurchase']
                    }
                }
            },

            // group by seller and sum up total revenue
            {
                $group: {
                    _id: '$productDetails.seller',
                    totalRevenue: { $sum: '$itemRevenue' },
                    totalOrders: { $sum: 1 },
                    totalItemsSold: { $sum: '$products.quantity' }
                }
            },

            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    totalOrders: 1,
                    totalItemsSold: 1
                }
            }
        ]),

        OrderModel.aggregate([
            // unwind the products array to work with individual items
            {
                $unwind: '$products'
            },

            // lookup to get product details including seller information
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },

            // unwind the productDetails array
            {
                $unwind: '$productDetails'
            },

            // filter only delivered orders
            {
                $match: comparisonFilter
            },

            // calculate revenue per item
            {
                $addFields: {
                    itemRevenue: {
                        $multiply: ['$products.quantity', '$products.priceAtPurchase']
                    }
                }
            },

            // group by seller and sum up total revenue
            {
                $group: {
                    _id: '$productDetails.seller',
                    totalRevenue: { $sum: '$itemRevenue' },
                    totalOrders: { $sum: 1 },
                    totalItemsSold: { $sum: '$products.quantity' }
                }
            },

            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    totalOrders: 1,
                    totalItemsSold: 1
                }
            }
        ])
    ])
    const currentRevenue = currentTimeRevenue[0]?.totalRevenue || 0;
    const previousRevenue = previousTimeRevenue[0]?.totalRevenue || 0;
    

    // absolute difference b/w current and previous revenue
    const difference = currentRevenue - previousRevenue;

    // growth percentage
    const growthPercentage = (difference / previousRevenue) * 100;
    let message = '';

    // create message based on growth
    if (currentRevenue === 0 && previousRevenue === 0) {
        message = 'No revenue data for either period.';
    } else if (previousRevenue === 0) {
        message = `Recent revenue: ${currentRevenue}. No previous period for comparison.`;
    } else {
        const formattedGrowth = growthPercentage.toFixed(2);
        if (difference > 0) {
            message = `Revenue increased by ${formattedGrowth}% compared to the previous period.`;
        } else if (difference < 0) {
            message = `Revenue decreased by ${Math.abs(formattedGrowth)}% compared to the previous period.`;
        } else {
            message = `Revenue remained the same compared to the previous period.`;
        }
    }

    sendApiResponse(res, 200, {
        data: {
            currentRevenue: currentTimeRevenue[0]?.totalRevenue || 0,
            previousRevenue: previousTimeRevenue[0]?.totalRevenue || 0
        },
        message
    })
})