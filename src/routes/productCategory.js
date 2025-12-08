// Categories with their subcategories for the frontend to display

const { Router } = require('express');
const { getCategories, getCategoryByName } = require('../controllers/productCategory.js');
const checkCachedData = require('../middlewares/cache.js');

const categoryRouter = Router();

categoryRouter.route('/')
    .get(checkCachedData('category'), getCategories) //get all categories

categoryRouter.route('/:name')
    .get(checkCachedData('category'), getCategoryByName) //get category by name

module.exports = categoryRouter;
