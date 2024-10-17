let cityName = '';
document.addEventListener('DOMContentLoaded', function() {
  /*SEARCH FUNCTIONALITY*/
  document.getElementById('search-bar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      cityName = document.getElementById('search-bar').value;
      fetchWeather(cityName);
      fetchForecast(cityName);
    }
  });

  function displayErrorMessage(message) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block'; // Show the error message
  }

  function clearErrorMessage() {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.style.display = 'none'; // Hide the error message
  }

  /*IMAGES*/
  function getLocalImage(description, iconCode) {
    const weatherConditions = {
      clear: ['clear sky', 'sunny'],
      cloudy: ['few clouds', 'scattered clouds', 'broken clouds', 'overcast clouds'],
      rain: ['rain', 'light rain', 'shower rain', 'drizzle'],
      mist: ['mist', 'fog', 'haze'],
      snow: ['snow', 'light snow'],
    };

    if (weatherConditions.clear.includes(description) && iconCode === '01n') {
      return 'clear_night.jpg'; 
    } else if (weatherConditions.clear.includes(description)) {
      return 'clear_day.jpg'; 
    } else if (weatherConditions.cloudy.includes(description) && iconCode === '04n') {
      return 'cloudy_night.jpg';
    } else if (weatherConditions.cloudy.includes(description)) {
      return 'cloudy_day.png';
    } else if (weatherConditions.rain.includes(description)) {
      return 'rain.png';
    } else if (weatherConditions.mist.includes(description)) {
      return 'misty.png';
    } else if (weatherConditions.snow.includes(description)) {
      return 'snow.png';
    }

    return 'default_image.png';
  }

  /*OPENWEATHER*/
  async function fetchIconImage(iconCode) {
    const imageURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; 
    updateLocationImage(imageURL);
  }

  function updateWeatherInfo(weatherData) {
    const city_name = weatherData.name;
    const temperature = weatherData.main.temp;
    const description = weatherData.weather[0].description;
    const iconCode = weatherData.weather[0].icon; 

    const localImage = getLocalImage(description.toLowerCase(), iconCode);

    document.getElementById('city-name').textContent = city_name;
    document.getElementById('temperature').textContent = `${temperature}°C`;
    document.getElementById('description').textContent = description;

    updateWeatherIconAndImage(iconCode, localImage);
  }

  function updateWeatherIconAndImage(iconCode, localImageFileName) {
    const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weather-icon').src = iconURL;

    document.getElementById('img').src = localImageFileName;
  }

  function updateLocationImage(imageURL) {
    document.getElementById('img').src = imageURL;
  }
    
  async function fetchWeather(cityName) {
    const apiKey = '6a5500c10ff0c1efc2b3a01f7bb5a792'; 
    const openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`; 
    try {
      const response = await fetch(openWeatherURL);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('City not found. Please enter a valid city name.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const weatherData = await response.json();
      updateWeatherInfo(weatherData);
      clearErrorMessage(); // Clear any previous errors on successful fetch
    } catch (error) {
      displayErrorMessage(error.message); // Display error message
      console.error('Error fetching weather data', error);
    }
  }

  async function fetchForecast(cityName) {
    const apiKey = '6a5500c10ff0c1efc2b3a01f7bb5a792'; 
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(forecastURL);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('City not found. Please enter a valid city name.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const forecastData = await response.json();
      const nextFiveDays = extractFiveDayTemperatures(forecastData);
      
      updateBarChart(nextFiveDays); 
      updateDoughnutChart(extractWeatherConditions(forecastData)); // For the doughnut chart
      updateLineChart(nextFiveDays);
      clearErrorMessage(); // Clear any previous errors on successful fetch
    } catch (error) {
      displayErrorMessage(error.message); // Display error message
      console.error('Error fetching forecast data', error);
    }
  }


  function extractFiveDayTemperatures(forecastData) {
    const dailyTemperatures = [];
    const labels = [];

    for (let i = 0; i < forecastData.list.length; i += 8) {
      const day = forecastData.list[i];
      const temp = day.main.temp;
      const date = new Date(day.dt * 1000).toLocaleDateString();

      dailyTemperatures.push(temp);
      labels.push(date);
    }

    return { temperatures: dailyTemperatures, labels: labels };
  }

  function extractWeatherConditions(forecastData) {
    const weatherConditions = {
        Sunny: 0,
        Cloudy: 0,
        Rain: 0,
        Mist: 0,
        Snow: 0
    };

    forecastData.list.forEach(entry => {
        const description = entry.weather[0].description.toLowerCase();
        if (description.includes('clear')) {
            weatherConditions.Sunny++;
        } else if (description.includes('cloud')) {
            weatherConditions.Cloudy++;
        } else if (description.includes('rain')) {
            weatherConditions.Rain++;
        } else if (description.includes('mist') || description.includes('fog')) {
            weatherConditions.Mist++;
        } else if (description.includes('snow')) {
            weatherConditions.Snow++;
        }
    });

    return weatherConditions;
  }
  /*CHART.JS*/
  /*1.BAR CHART*/
  const ctx = document.getElementById('bar-chart').getContext('2d');
  let chartInstance = null;

  function updateBarChart(forecastData) {
    const { temperatures, labels } = forecastData;

    if (chartInstance) {
      chartInstance.destroy(); 
    }

    barchartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels, 
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures, 
          borderWidth: 1,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
  /*2.DOUGHNUT CHART*/
  const doughnutCtx = document.getElementById('doughnut-chart').getContext('2d');
  let doughnutChartInstance = null;
  
  function updateDoughnutChart(weatherConditions) {
      if (doughnutChartInstance) {
          doughnutChartInstance.destroy(); 
      }
  
      const conditionLabels = Object.keys(weatherConditions);
      const conditionCounts = Object.values(weatherConditions);
  
      doughnutChartInstance = new Chart(doughnutCtx, {
          type: 'doughnut',
          data: {
              labels: conditionLabels, 
              datasets: [{
                  label: 'Weather Conditions',
                  data: conditionCounts, 
                  backgroundColor: [
                      'rgba(255, 206, 86, 0.2)',  // Color for Sunny
                      'rgba(75, 192, 192, 0.2)',  // Color for Cloudy
                      'rgba(153, 102, 255, 0.2)', // Color for Rain
                      'rgba(255, 99, 132, 0.2)',  // Color for Mist
                      'rgba(54, 162, 235, 0.2)',  // Color for Snow
                  ],
                  borderColor: [
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                  ],
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              aspectRatio: 1.5,
              plugins: {
                  legend: {
                      display: false,
                  },
                  tooltip: {
                      callbacks: {
                          label: function(tooltipItem) {
                              const total = conditionCounts.reduce((sum, count) => sum + count, 0);
                              const percentage = ((conditionCounts[tooltipItem.dataIndex] / total) * 100).toFixed(2);
                              return `${tooltipItem.label}: ${percentage}%`;
                          }
                      }
                  }
              }
          }
      });
    }
    /*LINE CHART*/
    const lineCtx = document.getElementById('line-chart').getContext('2d');
    const lineCanvas = document.getElementById('line-chart');
    let lineChartInstance = null;
    
    function updateLineChart(forecastData) {
      const { temperatures, labels } = forecastData;
    
      lineCanvas.width = 600;

      if (lineChartInstance) {
        lineChartInstance.destroy(); 
      }
    
      lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: labels, 
          datasets: [{
            label: 'Temperature (°C)',
            data: temperatures, 
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          //aspectRatio: 1,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Temperature (°C)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    }
});