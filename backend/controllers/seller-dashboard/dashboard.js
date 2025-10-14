import mongoose from "mongoose";
import OrderModel from "../../models/order-model.js";
import controllerWrapper from "../../utils/controller-wrapper.js";
import sendApiResponse from "../../utils/api-response.js";
import CustomError from "../../error-handling/custom-error-class.js";


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