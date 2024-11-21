import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import Login from './pages/Login'
import Logout from './components/Logout'
import ProtectedRoute from './pages/ProtectedRoute'
import Graph from './pages/Graph'
import Chart from './pages/Chart'
import NoPage from './pages/NoPage'
import Navbar from './components/Navbar';
import './App.css'
import Heatmap from './pages/Heatmap';
import Dashboard from './pages/Dashboard';


const App = () => {
  const token = localStorage.getItem('token'); 

  return (
    <div className="App">
      <Router>
        <Navbar/>
        <Routes>
          
          <Route path="/login" element={<Login/>} />
          <Route path="/heatmap" element={<Heatmap/>} />
          <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path="/chart" element={<ProtectedRoute><Chart/></ProtectedRoute>}/>
          <Route  path="/graph" element={<ProtectedRoute><Graph/></ProtectedRoute>}/>
          <Route  path="/logout" element={<ProtectedRoute><Logout/></ProtectedRoute>}/>
          <Route  path="/*" element={<ProtectedRoute><NoPage/></ProtectedRoute>}   />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
