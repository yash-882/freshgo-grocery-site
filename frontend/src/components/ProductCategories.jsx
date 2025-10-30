import React from 'react'
import { allCategories } from '../constants/productCategories'

// Product Categories with product list
const ProductCategories = () => {

  return (
    <div className="container-fluid">
      <div className="container-fluid px-1 py-1">
        <h5 className='fw-semibold mb-4'>
          Explore Categories
        </h5>


        {allCategories.map(category => (
          // contains list of products for each category
          <div key={category.label} className='py-1'>

            {/* Category title and view all link*/}
            <div className='d-flex align-items-center mb-2'>
              <h5 className="greyish-font d-inline fw-semibold me-2 mb-0">
                {/* Category title */}
                {category.label}
              </h5>
              <a href="#" className='text-primary small text-decoration-none'>
                More
              </a>
            </div>


            {/* Product list */}
            <ul className="row pt-4 pb-3 px-2  product-category-items-list bg-dark">
              {category.products.map(prod => (

                <li
                  key={prod.productName}
                  className="col-3 col-sm-2 col-md-2 product-category-item col-lg-1 col-xl-1 p-1 my-2 list-unstyled"
                >
                  <a
                    className="nav-link text-white text-center"
                    href="#">
                    <img
                      src={prod.imageUrl}
                      alt={prod.productName}
                      className="img-fluid category-product-image mb-1"
                    />
                    <span className="text-white text-center">
                      {prod.productName}
                    </span>
                  </a>
                </li>


              ))}

            </ul>
          </div>
        ))}

      </div>

    </div>
  )

}

export default ProductCategories
