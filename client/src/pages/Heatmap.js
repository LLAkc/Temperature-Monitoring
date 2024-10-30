import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const Heatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    // Fetch heatmap data from backend
    axios.get('http://localhost:5000/heatmap')
      .then((response) => {
        setHeatmapData(response.data);
      })
      .catch(err => console.error("Failed to fetch data:", err));
  }, []);

  const generatePlotData = () => {
    if (heatmapData.length === 0) {
      console.log("Heatmap data is still loading or empty.");
      return null;
    }

    // Log the entire heatmapData to check its structure
    console.log("Heatmap Data:", heatmapData);

    // Extract x, y, and z (temperature) values from the response
    const x = heatmapData[0].map(point => point.x); // Get the x values from the first row (assuming x is consistent horizontally)
    const y = heatmapData.map(row => row[0].y); // Get the y values from the first element of each row (y varies vertically)
    const z = heatmapData.map(row => row.map(point => point.temperature)); // Extract temperature (z) values

    // Log to check the extracted x, y, z values
    console.log("Extracted x:", x);
    console.log("Extracted y:", y);
    console.log("Extracted z (temperature):", z);

    return { x, y, z };
  };

  const plotData = generatePlotData();

  return (
    <div>
      <h2>2D Heatmap</h2>
      {plotData ? (
        <Plot
          data={[
            {
              z: plotData.z,  // Temperature values (2D array)
              x: plotData.x, // X coordinates
              y: plotData.y, // Y coordinates
              type: 'heatmap',
              hoverinfo: 'x+y+z',
              colorscale: 'Viridis',  // Heatmap color scale
            }
          ]}
          layout={{ title: '2D Heatmap', height: 600, width: 600 }}
        />
      ) : (
        <p>Loading heatmap...</p>
      )}

      <h2>3D Heatmap</h2>
      {plotData ? (
        <Plot
          data={[
            {
              z: plotData.z,  // Temperature values (2D array)
              x: plotData.x, // X coordinates
              y: plotData.y, // Y coordinates
              type: 'surface',
              hoverinfo: 'x+y+z',
              colorscale: 'Viridis',  // Color scale for surface plot
            }
          ]}
          layout={{ title: '3D Heatmap', height: 600, width: 600 }}
        />
      ) : (
        <p>Loading heatmap...</p>
      )}
    </div>
  );
}


export default Heatmap;

