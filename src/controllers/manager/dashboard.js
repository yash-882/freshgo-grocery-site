const OrderModel = require("../../models/order.js");
const sendApiResponse = require("../../utils/apiResponse.js");
const CustomError = require("../../error-handling/customError.js");


// Warehouse dashboard for warehouse_manager-----------------------------

// revenue stats
exports.revenueStats = async (req, res, next) => {
  const { time } = req.query;

  if (time && !(['year_to_date', 'last_30_days'].includes(time))) {
    return next(
      new CustomError(
        'BadRequestError',
        'Invalid time parameter. Use "year_to_date" for this year or "last_30_days" for last 30 days.',
        400
      )
    );
  }

  const managedWarehouse = req.managedWarehouse;

  // build time filter
  const dateFilter = {};
  switch (time) {
    case 'year_to_date':
      const currentYear = new Date().getFullYear();
      dateFilter.$gte = new Date(currentYear, 0, 1);
      break;
    case 'last_30_days':
      dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const matchStage = {
    orderStatus: 'delivered',
    ...(time && { createdAt: dateFilter })
  };

  const [revenueStats] = await OrderModel.aggregate([
    { $unwind: '$products' },

    // lookup product details
    {
      $lookup: {
        from: 'products',
        localField: 'products.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },

    // only include products that have the warehouse of this manager
    {
      $match: {
        ...matchStage,
        'productDetails.warehouses.warehouse': managedWarehouse
      }
    },

    // calculate revenue per item
    {
      $addFields: {
        // find the quantity in this warehouse
        warehouseQuantity: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: '$productDetails.warehouses',
                    cond: { $eq: ['$$this.warehouse', managedWarehouse] }
                  }
                },
                as: 'w',
                in: '$$w.quantity'
              }
            },
            0
          ]
        },
        itemRevenue: { $multiply: ['$products.priceAtPurchase', '$products.quantity'] }
      }
    },

    // group by warehouse (or just total for this manager)
    {
      $group: {
        _id: null,
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
  ]);

  sendApiResponse(res, 200, {
    data: {
      totalRevenue: revenueStats?.totalRevenue || 0,
      totalOrders: revenueStats?.totalOrders || 0,
      totalItemsSold: revenueStats?.totalItemsSold || 0
    }
  });
}


// top 5 selling products from current warehouse
exports.topFiveSellingProducts = async (req, res, next) => {
  const managedWarehouse = await getManagedWarehouseByUser(req.user);
  if (!managedWarehouse) {
    return next(new CustomError('ForbiddenError', 'You are not assigned to any warehouse yet.', 403));
  }

  const topProducts = await OrderModel.aggregate([
    // unwind the products array
    { $unwind: '$products' },

    // lookup product details
    {
      $lookup: {
        from: 'products',
        localField: 'products.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },

    // only delivered orders
    { $match: { orderStatus: 'delivered' } },

    // only products that include the manager's warehouse
    { $match: { 'productDetails.warehouses.warehouse': managedWarehouse } },

    // calculate the quantity sold from this warehouse
    {
      $addFields: {
        warehouseQuantity: {
          $reduce: {
            input: '$productDetails.warehouses',
            initialValue: 0,
            in: {
              $cond: [
                { $eq: ['$$this.warehouse', managedWarehouse] },
                '$$this.quantity',
                '$$value'
              ]
            }
          }
        },
        itemRevenue: { $multiply: ['$products.priceAtPurchase', '$products.quantity'] }
      }
    },

    // group by product
    {
      $group: {
        _id: '$productDetails._id',
        productName: { $first: '$productDetails.name' },
        productPrice: { $first: '$productDetails.price' },
        productCategory: { $first: '$productDetails.category' },
        totalSold: { $sum: '$products.quantity' }, // optionally, could use warehouseQuantity if you want per-warehouse
        revenue: { $sum: '$itemRevenue' }
      }
    },

    // project the output
    {
      $project: {
        _id: 0,
        product: {
          _id: '$_id',
          name: '$productName',
          price: '$productPrice',
          category: '$productCategory'
        },
        totalSold: 1,
        revenue: 1
      }
    },

    // sort descending by total sold
    { $sort: { totalSold: -1 } },

    // limit to top 5
    { $limit: 5 }
  ]);

  sendApiResponse(res, 200, {
    data: { topFiveSellingProducts: topProducts || [] }
  });
}


// this month vs last month / this year vs last year
exports.revenueComparison = async (req, res, next) => {
    const { comparison } = req.params;
    const managedWarehouse = req.managedWarehouse;

    if (!['last_30_days', 'year_to_date'].includes(comparison)) {
        return next(
            new CustomError(
                'BadRequestError',
                'Invalid time. Use "year_to_date" or "last_30_days".',
                400
            )
        );
    }

    // ------------------------
    // DATE RANGE CALCULATIONS
    // ------------------------
    const now = Date.now();
    const currentYear = new Date().getFullYear();

    let currentRange = {};
    let previousRange = {};

    if (comparison === 'year_to_date') {
        currentRange = {
            $gte: new Date(currentYear, 0, 1)
        };
        previousRange = {
            $gte: new Date(currentYear - 1, 0, 1),
            $lt: new Date(currentYear, 0, 1)
        };
    }

    if (comparison === 'last_30_days') {
        const last30Start = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const last60Start = new Date(now - 60 * 24 * 60 * 60 * 1000);

        currentRange = { $gte: last30Start };
        previousRange = { $gte: last60Start, $lt: last30Start };
    }

    // ------------------------
    // PIPELINE FACTORY
    // ------------------------
    const pipeline = dateRange => [
        {
            $match: {
                orderStatus: 'delivered',
                createdAt: dateRange
            }
        },

        { $unwind: '$products' },

        {
            $lookup: {
                from: 'products',
                let: { pid: '$products.product', warehouse: managedWarehouse },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$pid'] },

                                    // Product must exist in THIS warehouse
                                    {
                                        $in: [
                                            '$$warehouse',
                                            '$warehouses.warehouse'
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ],
                as: 'productDetails'
            }
        },

        // Only keep products that exist in the warehouse
        { $unwind: '$productDetails' },

        {
            $addFields: {
                itemRevenue: {
                    $multiply: [
                        '$products.quantity',
                        '$products.priceAtPurchase'
                    ]
                }
            }
        },

        {
            $group: {
                _id: null,
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
    ];

    // ------------------------
    // RUN BOTH PIPELINES
    // ------------------------
    const [currentAgg, previousAgg] = await Promise.all([
        OrderModel.aggregate(pipeline(currentRange)),
        OrderModel.aggregate(pipeline(previousRange))
    ]);

    const currentRevenue = currentAgg[0]?.totalRevenue || 0;
    const previousRevenue = previousAgg[0]?.totalRevenue || 0;

    const diff = currentRevenue - previousRevenue;

    let message = '';

    if (currentRevenue === 0 && previousRevenue === 0) {
        message = 'No revenue data for either period.';
    } else if (previousRevenue === 0) {
        message = `Recent revenue: ${currentRevenue}. No previous period for comparison.`;
    } else {
        const growth = ((diff / previousRevenue) * 100).toFixed(2);

        if (diff > 0) {
            message = `Revenue increased by ${growth}% compared to the previous period.`;
        } else if (diff < 0) {
            message = `Revenue decreased by ${Math.abs(growth)}% compared to the previous period.`;
        } else {
            message = 'Revenue remained the same compared to the previous period.';
        }
    }

    sendApiResponse(res, 200, {
        data: {
            currentRevenue,
            previousRevenue
        },
        message
    });
}
