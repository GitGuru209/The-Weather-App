let forecastData = [];
let currentPage = 1;
const itemsPerPage = 10;
let cityName = '';

function fetchForecast(cityName) {
  const apiKey = '6a5500c10ff0c1efc2b3a01f7bb5a792'; 
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      forecastData = data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temp: item.main.temp,
        description: item.weather[0].description
      }));
      renderTable();
    })
    .catch(error => console.error('Error:', error));
}

function renderTable() {
  const tableBox = document.querySelector('.table-box');
  tableBox.innerHTML = ''; 

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Temperature (°C)</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody id="forecast-body"></tbody>
  `;

  const tbody = table.querySelector('#forecast-body');

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = forecastData.slice(startIndex, endIndex);

  pageData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.date.toLocaleDateString()}</td>
      <td>${item.temp.toFixed(1)}</td>
      <td>${item.description}</td>
    `;
    tbody.appendChild(row);
  });

  tableBox.appendChild(table);

  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'controls-container';

  // Add pagination controls first
  const paginationControls = document.createElement('div');
  paginationControls.className = 'pagination-controls';
  paginationControls.innerHTML = `
    <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${currentPage} of ${Math.ceil(forecastData.length / itemsPerPage)}</span>
    <button id="next-page" ${endIndex >= forecastData.length ? 'disabled' : ''}>Next</button>
    <br><br>
  `;

  controlsContainer.appendChild(paginationControls);

  // Add filter buttons below pagination
  const filterControls = document.createElement('div');
  filterControls.className = 'filter-controls';
  filterControls.innerHTML = `
    <button class="filter-btn" id="sort-asc-btn">Sort Temperature ↑</button>
    <button class="filter-btn" id="sort-desc-btn">Sort Temperature ↓</button>
    <button class="filter-btn" id="rainy-days-btn">Show Rainy Days</button>
    <button class="filter-btn" id="highest-temp-btn">Show Highest Temperature</button>
  `;

  controlsContainer.appendChild(filterControls);

  // Add the controls container to the table box
  tableBox.appendChild(controlsContainer);

  // Add event listeners for pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if (endIndex < forecastData.length) {
      currentPage++;
      renderTable();
    }
  });

  // Add event listeners for filter buttons
  document.getElementById('sort-asc-btn').addEventListener('click', sortTempsAsc);
  document.getElementById('sort-desc-btn').addEventListener('click', sortTempsDesc);
  document.getElementById('rainy-days-btn').addEventListener('click', filterRainyDays);
  document.getElementById('highest-temp-btn').addEventListener('click', highestTempDay);
}

async function fetchWeather(cityName) {
  const apiKey = '6a5500c10ff0c1efc2b3a01f7bb5a792'; 
  const openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`; 
  try {
    const response = await fetch(openWeatherURL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const weatherData = await response.json();
  } catch (error) {
    console.error('Error fetching weather data', error);
  }
}

/*FILTER FUNCTIONS*/
function sortTempsAsc() {
  forecastData.sort((a, b) => a.temp - b.temp);
  renderTable();
}
function sortTempsDesc() {
  forecastData.sort((a, b) => b.temp - a.temp);
  renderTable();
}
function filterRainyDays() {
  forecastData = forecastData.filter(item => item.description.includes('rain'));
  renderTable();
}
function highestTempDay() {
  const hottestDay = forecastData.reduce((max, item) => (item.temp > max.temp ? item : max), forecastData[0]);
  forecastData = [hottestDay]; // Display only the day with the highest temp
  renderTable();
}

document.addEventListener('DOMContentLoaded', function () { 
  document.getElementById('search-bar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      cityName = document.getElementById('search-bar').value;
      fetchWeather(cityName); 
      fetchForecast(cityName);
    }
  });
  document.getElementById('sort-asc-btn').addEventListener('click', sortTempsAsc);
  document.getElementById('sort-desc-btn').addEventListener('click', sortTempsDesc);
  document.getElementById('rainy-days-btn').addEventListener('click', filterRainyDays);
  document.getElementById('highest-temp-btn').addEventListener('click', highestTempDay);
});