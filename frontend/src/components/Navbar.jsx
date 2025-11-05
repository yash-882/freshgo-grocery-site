import React, { useState } from 'react';
import { Search, ShoppingCart, UserCircle2,  MapPin, LucideMoreVertical, X } from 'lucide-react';
import AccountSettings from './AccountSettings';

const Navbar = () => {
  const [searchText, setSearchText] = useState('');
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // clear search input
  const clearSearch = () => {
    setSearchText('');
  };

  // toggle nav items expansion
  const handleExpandNavItems = () => {
    // Logic to expand or show additional navigation items
    setIsNavExpanded(currentStatus => !currentStatus)
  }

  // Navbar component
  return (
    <>
      <nav className="navbar-custom">

        <div className="container-fluid  px-3 px-md-4">
          <div className="navbar-content">
            {/* Logo */}
            <div className="navbar-brand-custom">
              <span className="brand-text">🛒FreshGo</span>
            </div>

            {/* Center Section - Search Bar (Desktop) */}
            <div className="navbar-center d-none d-lg-flex">
              <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for products..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button className="clear-search" onClick={clearSearch}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section - Address & Icons */}
            <div className="navbar-right">

              {/* Expanded menu for all devices (slider) */}
              {
                isNavExpanded && <AccountSettings handleExpandNavItems={handleExpandNavItems} />
              }


              {/* Address - Always Visible */}
              <div className="address-section">
                <MapPin size={21} className="address-icon" />
                <span className="address-text">Deliver to Home</span>
              </div>
              {/* Menu Items - Always Visible in navbar*/}
              <div className="menu-items">

                {/* cart */}
                <a href="#cart" className="nav-item-custom d-flex nav-visible-link">
                  <ShoppingCart size={22} />
                  <span className="badge">
                    2
                  </span>
                </a>

                {/* login */}
                <a href="#login" className="nav-item-custom login-link nav-visible-link">
                  <UserCircle2 size={22} />
                  Login
                </a>

              </div>
              {/* Button to expand more optins/settings  */}
              <div className="expand-nav-items">
                <button onClick={handleExpandNavItems} className="expand-nav-items-btn">
                  <LucideMoreVertical color='white' size={22} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar - Below Navbar */}
      <div className="mobile-search-wrapper w-100 d-lg-none">
        <div className="container-fluid d-flex justify-content-center px-2">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search for groceries..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            {searchText && (
              <button className="clear-search" onClick={clearSearch}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;