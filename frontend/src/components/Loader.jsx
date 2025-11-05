import React from 'react'

// Loader 
const Loader = ({loaderRef=null}) => {
    return (
        <div 
        className="loader-container d-flex justify-content-center align-items-center">
            <div ref={loaderRef} className="loader">
            </div>
        </div>
    )
}

export default Loader
