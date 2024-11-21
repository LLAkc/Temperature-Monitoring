import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'
import Logout from './Logout';
import './Navbar.css';  


const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  
  const isTokenExpired = (token) => {
    try {
      const decodedToken = jwtDecode(token);  // Decode the token to get its payload
      const currentTime = Date.now() / 1000;  // Get current time in seconds

      // Check if the token is expired by comparing the exp field with current time
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Invalid token:', error);
      return true;  // If decoding fails, consider the token invalid/expired
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <ul className="nav-links">
        <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              DashBoard
            </Link>
          </li>
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

          {!isTokenExpired(token) && (
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

