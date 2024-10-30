import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');  // Clear the token
    navigate('/login');  // Redirect to login page
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;
