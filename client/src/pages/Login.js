import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import { jwtDecode } from 'jwt-decode'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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

    if(token || !isTokenExpired(token)){
      return navigate('/');
    }
  })

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/login', { username, password })
      .then(response => {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.access_token);
        
        // Redirect to chart or dashboard page after login
        navigate('/');
      })
      .catch(error => {
        setError('Invalid username or password');
      });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>NextHops Monitoring System</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="input-field"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
      
    </div>
  );
};

export default Login;
