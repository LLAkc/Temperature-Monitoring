import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Chart.css';

const Chart = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [chartData, setChartData] = useState({ Temperature1: [],Temperature2: [],Humidity1: [],Humidity2: [], time: []});
  const [range, setRange] = useState([0, 0]);
  const [activeTool, setActiveTool] = useState('zoom');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUserInteracting, setIsUserInteracting] = useState(false);  // Track user interaction
  const plotRef = useRef(null)

  const [traceVisibility, setTraceVisibility] = useState({
    Temperature1: true,
    Temperature2: true,
    Humidity1: true,
    Humidity2: true
  });

  const fetchData = (date) => {
    const dateStr = date.toISOString().split('T')[0]; // Format date for query

    axios.get(`http://localhost:5000/chart?date=${dateStr}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      setChartData({
        Temperature1: response.data.Temperature1,
        Temperature2: response.data.Temperature2,
        Humidity1: response.data.Humidity1,
        Humidity2: response.data.Humidity2,
        time: response.data.time,
      });
      if (response.data.time.length > 10 && !isUserInteracting) {
        setRange([response.data.time.length - 10, response.data.time.length]);
        
      }
      
    
      
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      if (error.response && error.response.status === 401) {
        window.alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      }
    });
  };

  useEffect(() => {
    fetchData(selectedDate);

    const interval = setInterval(() => {
      fetchData(selectedDate); // Periodically refetch for real-time monitoring
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedDate,isUserInteracting]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchData(date);
  };

/*
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/chart', {headers: {Authorization: `Bearer ${token}`}})
        .then(response => {
          setChartData(prevData => ({
            
            
          }));
          
          setRange(([first, second]) => {
            if (second > 10) {
              return [first + 1, second + 1]; // Increase the first value until it reaches 10
            } else {
              return [first, second + 1]; // Once the first reaches 10, start increasing the second
            }
          });
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          // If error status is 401, display alert and navigate to login
          if (error.response && error.response.status === 401) {
            window.alert('Session expired. Please log in again.');
            localStorage.removeItem('token'); 
            navigate('/login');  // Redirect to login page after clicking Ok
          }
        });
      
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);*/

  const handleRelayout = (event) => {
    if (event['xaxis.range[0]'] && event['xaxis.range[1]']) {
      setIsUserInteracting(true);
      setRange([event['xaxis.range[0]'], event['xaxis.range[1]']]);  // Store current range
    }
  };

  const handleModebarClick = (tool) => {
    setActiveTool(tool);  // Store the selected tool
    //setIsUserInteracting(true);
    if (plotRef.current) {
      Plotly.relayout(plotRef.current.el, { dragmode: tool });  // Apply the selected tool
    }
  };

  const resetView = () => {
    setIsUserInteracting(false);
    if (chartData.time.length > 10) {
      setRange([chartData.time.length - 10, chartData.time.length]);
      
    }
  };

  return (
    <div className="chart-container">
      <h1 className="title-chart">Temperature & Humidity Monitoring</h1>
      <div className="date-picker">
        <label>Select Date:</label>
        <DatePicker selected={selectedDate} onChange={handleDateChange} />
      </div>
      <div className="digital-monitoring">
        <div className="monitoring-item">
          <span>Temperature 1:</span>
          <span className="digital-value">{chartData.Temperature1.slice(-1)[0]}°C</span>
        </div>
        <div className="monitoring-item">
          <span>Temperature 2:</span>
          <span className="digital-value">{chartData.Temperature2.slice(-1)[0]}°C</span>
        </div>
        <div className="monitoring-item">
          <span>Humidity 1:</span>
          <span className="digital-value">{chartData.Humidity1.slice(-1)[0]}%</span>
        </div>
        <div className="monitoring-item">
          <span>Humidity 2:</span>
          <span className="digital-value">{chartData.Humidity2.slice(-1)[0]}%</span>
        </div>
      </div>

      <Plot
        ref={plotRef}
        data={[
          {
            x: chartData.time,
            y: chartData.Temperature1,
            type: 'scatter',
            mode: 'lines',
            name: 'Temperature 1',
            line: { color: 'red' },
            visible: traceVisibility.Temperature1 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Temperature2,
            type: 'scatter',
            mode: 'lines',
            name: 'Temperature 2',
            line: { color: 'orange' },
            visible: traceVisibility.Temperature2 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Humidity1,
            type: 'scatter',
            mode: 'lines',
            name: 'Humidity 1',
            line: { color: 'blue' },
            visible: traceVisibility.Humidity1 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Humidity2,
            type: 'scatter',
            mode: 'lines',
            name: 'Humidity 2',
            line: { color: 'lightblue' },
            visible: traceVisibility.Humidity2 ? true : 'legendonly'
          },
        ]}
        layout={{
          width: 1000,
          height: 500,
          title: 'Temperature & Humidity Levels',
          xaxis: {
            title: 'Time',
            //rangeslider: { visible: true },
            range: range || null,  // Preserve the current range if available
            //fixedrange:true
          },
          yaxis: { title: 'Values', range: [0, 50] },  // Adjust range according to expected data
          dragmode: activeTool
        }}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: [ 'resetScale2d','autoScale2d','pan2d','zoom2d'],
          displaylogo: false,
          modeBarButtonsToAdd: [
            {
                name: 'Pan',
                icon: Plotly.Icons.pan,
                click: () => handleModebarClick('pan'),
                className: activeTool === 'pan' ? 'active-modebar' : '',
              },
              {
                name: 'Zoom',    
                icon: Plotly.Icons.zoombox,
                click: () => handleModebarClick('zoom'),
                className: activeTool === 'zoom' ? 'active-modebar' : '',
              },
              {
                name: 'Reset View',
                icon: Plotly.Icons.autoscale,
                click: resetView,  // Reset the layout on button click
              }
          ],
        }}
        
        onRelayout={handleRelayout}  // Capture when the user changes the view
        onLegendClick={(event) => {
          const traceIndex = event.curveNumber;
          const traceNames = ["Temperature1", "Temperature2", "Humidity1", "Humidity2"];
          const traceName = traceNames[traceIndex];
      
          if (traceName) {
            setTraceVisibility((prev) => ({
              ...prev,
              [traceName]: !prev[traceName], // Toggle visibility
            }));
          }
          return false; // Prevent default behavior of toggling visibility
        }}
      />
    </div>
  );
};


export default Chart;
