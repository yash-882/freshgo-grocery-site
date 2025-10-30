import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import ProductCategories from './components/ProductCategories'

function App() {

  return (
    <>
    <Navbar/>
    <main className="app-main">
      {/* Main content */}
    <ProductCategories/>
    </main>
    </>
  )
}

export default App
