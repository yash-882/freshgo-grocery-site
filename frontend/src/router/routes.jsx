import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import ProductListing from "../components/ProductListing";
import ProductCategories from "../components/ProductCategories";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            // home page
            {
                path: "/",
                element: <ProductCategories />

            },
            // product listing page
            {
                path: "/product",
                element: <ProductListing />,
            },
        ]
    }
])