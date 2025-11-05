import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { router } from './router/routes.jsx';
import { RouterProvider } from 'react-router-dom';

const react = (
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)

createRoot(document.getElementById('root')).render(react)
