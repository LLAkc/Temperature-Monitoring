// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';  // Fix import here

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // Function to check if the token is expired
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

  if (!token || isTokenExpired(token)) {
    // If no token or token is expired, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If token is valid, render the child components (protected pages)
  return children;
};

export default ProtectedRoute;
