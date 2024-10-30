import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logout from './Logout';
import './Navbar.css';  


const Navbar = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('token');  // Check if user is logged in

  return (
    <nav className="navbar">
      <div className="nav-left">
        <ul className="nav-links">
          <li>
            <Link to="/chart" className={location.pathname === '/chart' ? 'active' : ''}>
              Chart
            </Link>
          </li>
          <li>
            <Link to="/graph" className={location.pathname === '/graph' ? 'active' : ''}>
              Graph
            </Link>
          </li>

          {isLoggedIn && (
            <li>
              <Logout/>
            </li>
          )}
        </ul>
      </div>
      <div className="nav-right">
        <span className="company-name">NextHops</span>
      </div>
    </nav>
  );
};

export default Navbar;

