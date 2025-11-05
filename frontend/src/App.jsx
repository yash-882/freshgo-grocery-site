import './App.css'
import Navbar from './components/Navbar'
import { Outlet } from 'react-router-dom'

function App() {

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>

    </>
  )
}

export default App
