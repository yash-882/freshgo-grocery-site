import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Loader from '../components/Loader'
import normalizeLabel from '../utils/helpers/normalizeLabel'

// Product Categories with product list
const ProductCategories = () => {
  const [categories, setCategories] = useState([])
  const [fetchAgain, setFetchAgain] = useState(true)

  useEffect(() => {
    if(!fetchAgain) return
    const getCategories = async () => {

      try {
        const res = await axios.get('http://192.168.1.8:3000/api/category')
        setCategories(res.data.data)
        setTimeout(() => setFetchAgain(!fetchAgain), 1000*60*60)
      } catch (err) {
        console.log(err)
      }
    }
    getCategories()

  }, [])

  return (
 
      <div className="container-fluid product-category-list p-3">

        <h5 className='fw-semibold mb-4'>
          Explore Categories
        </h5>

        <div className="row ">
        {categories.length > 0 ? (categories.map(category => (
          // contains list of products for each category
          <div key={category.name} className='col-3 col-sm-2 col-md-2 col-lg-2 col-xl-1 my-1 d-flex flex-column justify-content-between align-items-center  p-1'>

            {/* Category title and view all link*/}
            <div className='product-category-card'>
              <Link 
            
              state={{heading: `Shop ${normalizeLabel(category.name)}`}} 
              to={`/product?category=${category.name}`}
              
              className='product-category-card-link px-1 py-2 w-100 h-100 text-decoration-none d-flex flex-column align-items-center'>
              <img className='product-category-image' 
              src={category.imageUrl}  alt="Image not found" />
              <p className="greyish-font text-capitalize mt-1  text-center fw-semibold mb-0">
                {/* Category label */}
                { normalizeLabel(category.name) }
              </p>
              </Link>
            </div>
          </div>
        ))): <Loader />}
          </div>

      </div>
  )

}

export default ProductCategories
