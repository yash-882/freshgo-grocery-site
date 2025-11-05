import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Loader from './Loader'
import { ShoppingCart, Settings2Icon } from "lucide-react";
import { Link, useLocation } from 'react-router-dom'
const productsLimit = 12;

const ProductListing = () => {
  const location = useLocation();
  const queryObj = new URLSearchParams(location.search);

  const [products, setProducts] = useState([]);
  const [skipProdsCount, setSkipProdsCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const loaderRef = useRef(null);

  // Fetch products from API
  useEffect(() => {
    const getProducts = async () => {
      const URL = `http://192.168.1.8:3000/api/product?${queryObj.toString()}&skip=${skipProdsCount}&limit=${productsLimit}`
      try {
        const res = await axios.get(URL);
        const data = res.data.data;

        if (data?.length === 0) {
          setHasMore(false);
          return;
        }

        setProducts(prev => [...prev, ...data]);
        setIsInitialLoad(false); // Mark initial load complete
      } catch (err) {
        setHasMore(false);
        console.log(err);
      }
    };
    getProducts();
  }, [skipProdsCount]);

  // Intersection Observer
  useEffect(() => {
    if (!hasMore || isInitialLoad) return; // Don't observe until initial load is done

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {

          // skip last fetched products to fetch and get next productsLimit(count)
          setSkipProdsCount(prev => prev + productsLimit);
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    // clean up
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, isInitialLoad]);

  return (
    <div className="products-list-container">
      <div className="container-fluid">
        <div className="row">

          {/* Heading after result */}
          {products.length > 0 &&

            <div className="px-3 mb-4 d-flex justify-content-between align-items-center">
              <p className="mb-2 fw-bold text-capitalize">
                {location.state?.heading || 'Found Products'}
              </p>

              <button className="text-primary bg-transparent small border-0">
                <Settings2Icon /> Adjust
              </button>
            </div>
          }
          {products.length > 0 ? (
            products.map((product, idx) => (
              <div key={idx} className="col-6 col-sm-4  col-md-3 col-lg-2 d-flex flex-column align-items-center justify-content-center p-2 mb-2 text-white">
                <div
                  className={
                    `${product.inStock === false || product.quantity === 0
                      ? 'out-of-stock-cover' : 'w-100 h-100 product-item-container'}`}>


                  {/* product link */}
                  <Link to='' className="nav-link product-item  ">
                    <img src={product.images[0]} alt=""
                      className="product-list-item-img" />
                    <p className="product-item-name">{product.name}</p>
                    <p className="product-item-price mb-0">
                      {/* product price */}
                      ₹{product.price}
                    </p>

                  </Link>
                  {/* Add to cart button*/}
                  <button
                    disabled={product.inStock === false || product.quantity === 0}
                    className="add-to-cart-btn">
                    <ShoppingCart className="me-1" fill="white" strokeWidth={1.5} />
                    Add
                  </button>
                </div>
              </div>
            ))) :
            !hasMore &&
            // No products found message
            <h5 className="my-4 fw-semibold text-center ">
              We couldn't find what you're looking for. Try something else.

            </h5>
          }

        </div>


      </div>
      {!hasMore ? (

        <h2 className="text-center text-secondary py-4 mb-0 fw-bold ">
          You're at the finish line.
        </h2>

      )
        : (
          <Loader loaderRef={loaderRef} />
        )}
    </div>
  );
}

export default ProductListing;

