import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist';

import 'react-datepicker/dist/react-datepicker.css';
import './Chart.css';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Box,ThemeProvider, createTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone';

import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';


const textColor = 'rgba(255,255,255,0.75)';
const theme = createTheme({
  palette: {
    background: {
      paper: '#000000',
    },
    text: {
      primary: textColor,
      secondary: textColor,
    },
    action: {
      active: textColor,
    },
    success: {
      main: '#fff',
      light: '#33ab9f',
      dark: '#000000',
    },
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          
          minWidth: '50px',
          maxWidth: '150px',
          borderRadius: '5px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          border: '1px solid', // Default border
          borderRadius:'20px'
        },
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: '1px solid blue', // Blue border on focus
          },
        },
      },
    },
  },
});

dayjs.extend(utc);
dayjs.extend(timezone);

const Chart = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [chartData, setChartData] = useState({ Temperature1: [],Temperature2: [],Humidity1: [],Humidity2: [], time: []});
  const [rangeX, setRangeX] = useState([0, 0]);
  const [rangeY, setRangeY] = useState([15, 45]);
  const [activeTool, setActiveTool] = useState('zoom');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUserInteracting, setIsUserInteracting] = useState(false);  // Track user interaction
  const plotRef = useRef(null)
  const [servers, setServers] = useState(["1", "2", "3"]); 
  const [selectedServers,setSelectedServers] = useState([]);
  const [selectedTime, setSelectedTime] = useState(dayjs.utc("2025-01-01T00:00")); 
  const [selectedInterval, setSelectedInterval] = useState("Real Time");
  const [intervals, setintervals] = useState(["1 minute", "15 minutes", "1 hour", "3 hours", "12 hours", "24 hours"]);
  

  const [traceVisibility, setTraceVisibility] = useState({
    Temperature1: true,
    Temperature2: true,
    Humidity1: true,
    Humidity2: true
  });

  const fetchData = (date) => {
    const dateStr = date.toISOString().split('T')[0]; // Format date for query
    const timeStr = selectedTime.format('HH:mm:ss');

    axios.get(`http://localhost:5000/chart`, {
      params:{
        server_names:selectedServers,
        date:dateStr,
        Interval:selectedInterval,
        start_time:timeStr,
      },
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
      if (response.data.time.length > 15 && !isUserInteracting) {
        setRangeX([response.data.time.length - 15, response.data.time.length]); 
      }
        const allValues = [response.data.Temperature1, response.data.Temperature2, response.data.Humidity1, response.data.Humidity2];
        if (allValues.length > 0) {
          const minY = Math.min(...allValues) - 2;
          const maxY = Math.max(...allValues) + 2;
          setRangeY([minY, maxY]);
        }
       console.log(rangeY)
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
  }, [selectedServers,selectedInterval,selectedTime,selectedDate,isUserInteracting]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchData(date);
  };

  const handleRelayout = (event) => {
    if (event['xaxis.range[0]'] && event['xaxis.range[1]']) {
      setIsUserInteracting(true);
      setRangeX([event['xaxis.range[0]'], event['xaxis.range[1]']]);  // Store current range
    }
  };

  const handleModebarClick = (tool) => {
    setActiveTool(tool);  // Store the selected tool
    
    if (plotRef.current) {
      Plotly.relayout(plotRef.current.el, { dragmode: tool });  // Apply the selected tool
    }
  };

  const resetView = () => {
    setIsUserInteracting(false);
    if (chartData.time.length > 10) {
      setRangeX([chartData.time.length - 10, chartData.time.length]);
      
    }
  };

  const handleServerChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedServers(
      typeof value === 'string' ? value.split(',') : value,
    );
  };


  const handleTimeChange = (newValue) => {
    if (newValue) {
      setSelectedTime(newValue);
    }
  };
  const handleIntervalChange = (event) => {
    setSelectedInterval(event.target.value); 
  };

  return (
  <div className="chart-container">
    <h1 className="title-chart">Temperature & Humidity Monitoring</h1>
  
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

    <div className="plot-wrapper">
      
      {/* Date picker overlay */}
      <div class="controls">
        <ThemeProvider theme  = {theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs} >
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '2px solid #1976d2', // Blue border
              borderRadius: '8px',
              backgroundColor: '#0a071d', // Light gray background
              p: 2, // Padding
              gap: 5
        }}>
          <FormControl sx={{  minWidth: 150 }}>
            <InputLabel id="demo-multiple-checkbox-label">Servers</InputLabel>
              <Select
                labelId="demo-multiple-checkbox-label"
                id="demo-multiple-checkbox"
                multiple
                value={selectedServers}
                onChange={handleServerChange}
                input={<OutlinedInput label="Servers" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {servers.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={selectedServers.includes(name)} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <DatePicker defaultValue={dayjs(new Date())} sx={{'& .MuiInputBase-root': {
                minWidth: '140px', 
                maxWidth: '150px',
              },}}
              onChange={handleDateChange}
              label={'Date'}  
              views={['year', 'month', 'day']}
              slotProps={{field: {readOnly: true}}}
              format="DD-MM-YYYY"
            />
            
            <TimePicker label="Start Time" defaultValue={dayjs.utc("2025-01-01T21:00")} 
            ampm={false}  
            onChange={handleTimeChange}
            slotProps={{field: {readOnly: true}}}
            value={selectedTime}
            
            sx={{
              '& .MuiInputBase-root': {
                minWidth: '50px',
                maxWidth: '120px',
              },
            }}
            />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="demo-simple-select-helper-label">Interval</InputLabel>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={selectedInterval}
              label="Interval"
              onChange={handleIntervalChange}
            >
              <MenuItem value="Real Time">
                <em>Real Time</em>
              </MenuItem>
              {intervals.map((name) => (
                  <MenuItem key={name} value={name}>
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          
          </Box>
          </LocalizationProvider>
        </ThemeProvider>
        

      </div>
      <div className='plot'>
      <Plot
        ref={plotRef}
        data={[
          {
            x: chartData.time,
            y: chartData.Temperature1,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Temperature 1',
            line: { color: 'rgba(200,200,200,1)' ,shape:'spline' },
            marker: {color: chartData.Temperature1.map(temp => temp > 25 ? 'red' : 'green'), size: 10},
            visible: traceVisibility.Temperature1 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Temperature2,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Temperature 2',
            line: { color: 'orange',shape:'spline' },
            visible: traceVisibility.Temperature2 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Humidity1,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Humidity 1',
            line: { color: 'blue',shape:'spline' },
            visible: traceVisibility.Humidity1 ? true : 'legendonly'
          },
          {
            x: chartData.time,
            y: chartData.Humidity2,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Humidity 2',
            line: { color: 'lightblue',shape:'spline' },
            visible: traceVisibility.Humidity2 ? true : 'legendonly'
          },
        ]}
        layout={{
          paper_bgcolor: "rgba(10,7,29,1)", //background color of the chart container space
          plot_bgcolor: "rgba(172,172,172,0)",
          width: 1000,
          height: 500,
          title: 'Temperature & Humidity Levels',
          titlefont:{color: 'rgba(255,255,255,0.75)'},
          xaxis: { title: 'Time', range: rangeX || null,tickfont : {color : 'rgba(255,255,255,0.75)'},color:'white', gridcolor:'rgba(255,255,255,0.25)'},
          yaxis: { title: 'Values', range: rangeY,tickfont : {color : 'rgba(255,255,255,0.75)'},color:'white', gridcolor:'rgba(255,255,255,0.25)' },
          dragmode: activeTool,
          autosize: true,
          modebar:{color:"rgba(255,255,255,0.75)"},
          legend: { font: { color: 'rgba(255,255,255,0.75)' }},
          
          
        }}
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: [ 'resetScale2d','autoScale2d','pan2d','zoom2d','lasso2d','select2d'],
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
              click: resetView,
            },
          ],
        }}
        onRelayout={handleRelayout}
        
        onLegendClick={(event) => {
          const traceIndex = event.curveNumber;
          const traceNames = ["Temperature1", "Temperature2", "Humidity1", "Humidity2"];
          const traceName = traceNames[traceIndex];

          if (traceName) {
            setTraceVisibility((prev) => ({
              ...prev,
              [traceName]: !prev[traceName],
            }));
          }
          return false;
        }}
      />
      </div>
    </div>
  </div>
  );
};


export default Chart;
