import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import './Graph.css';
import { useNavigate } from 'react-router-dom'; // For navigation

const Graph = () => {
  const token = localStorage.getItem('token');
  const [data, setData] = useState(null);
  const [is3D, setIs3D] = useState(true);  // Default to 3D view
  const navigate = useNavigate();  // To handle navigation

  useEffect(() => {
    //const interval = setInterval(() => {
      axios.get('http://localhost:5000/dem-data', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setData(response.data);  // Update with the new data
      })
      .catch(error => {
        if (error.response && error.response.status === 401) {
            window.alert('Session expired. Please log in again.');
            localStorage.removeItem('token'); 
            navigate('/login');
        } else {
          console.error('Error fetching data:', error);
        }
      });
    //}, 3000);  // Update every 3 seconds (or adjust the interval as needed)

    //return () => clearInterval(interval);  // Cleanup interval on component unmount
  }, [token]);

  const toggleView = () => {
    setIs3D(!is3D);
  };

  return (
    <div className="container">
      <h1 className="title-graph">MGS Temperature Visualization</h1>

      <button className="toggle-btn" onClick={toggleView}>
        Switch to {is3D ? '2D' : '3D'}
      </button>

      {data && (
        <Plot
        
          data={[
            is3D
              ? {
                  x: data.x,
                  y: data.y,
                  z: data.z,
                  type: 'surface',  
                  colorscale: 'YlOrRd',
                  reversescale: true,
                }
              : {
                  x: data.x[0],  
                  y: data.y.map(row => row[0]),  
                  z: data.z,
                  type: 'contour',  
                  colorscale: 'YlOrRd',
                  reversescale: true,
                  contours: {
                    showlabels: true,  
                  },
                }
          ]}
          layout={{
            paper_bgcolor: "rgba(200,200,200,1)",
            title: is3D ? '3D Interpolated Heatmap' : '2D Interpolated Heatmap',
            scene: is3D
              ? {
                  xaxis: { title: 'X Axis' },
                  yaxis: { title: 'Y Axis' },
                  zaxis: { title: 'Temperature (Z)' },
                  camera: {  // Set the camera position
                    eye: {
                      x: -1.0,
                      y: -1.5,  
                      z: 1.5,   
                    }
                  }
                }
              : {
                  xaxis: { title: 'X Axis' },
                  yaxis: { title: 'Y Axis' },
                },
            autosize: true,
            width: 800,
            height: 800,
          }}
          config={{
            displayModeBar: true,  // Always show the modebar
            modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d','orbitRotation','zoom3d','resetCameraLastSave3d','resetScale2d','pan2d','pan3d'],  // Remove these buttons
            modeBarButtonsToAdd: [''],  // Add custom buttons
            displaylogo: false,  // Hide the Plotly logo
          }}
        />
      )}
    </div>
  );
};

export default Graph;
