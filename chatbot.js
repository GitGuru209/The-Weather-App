const WEATHER_API_KEY = '6a5500c10ff0c1efc2b3a01f7bb5a792';
const GEMINI_API_KEY = 'AIzaSyDsioLCdiSQ-6hI1gevUTgiHCqt1V4lFvM';
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'; // OpenWeather API Base URL

const WEATHER_KEYWORDS = ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy', 'humidity'];

initializeChatbot();

function initializeChatbot() {
    const chatInput = document.querySelector('#chat-input');
    const sendButton = document.querySelector('#send-button');

    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            handleUserMessage(message);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                handleUserMessage(message);
                chatInput.value = '';
            }
        }
    });

    displayResponse('Welcome! Ask me about the weather or anything else!', 'bot');
}

async function handleUserMessage(message) {
    try {
        console.log('User message:', message); // Debugging output
        displayResponse(message, 'user');
        showTypingIndicator();

        const weatherQuery = detectWeatherQuery(message);

        let response;
        if (weatherQuery.isWeatherQuery) {
            console.log('Detected weather query for location:', weatherQuery.location); // Debugging output
            response = await processWeatherRequest(weatherQuery.location);
        } else {
            console.log('Processing general request'); // Debugging output
            response = await processGeneralRequest(message);
        }

        hideTypingIndicator();
        displayResponse(response, 'bot');
    } catch (error) {
        console.error('Error processing message:', error); // More specific error message
        hideTypingIndicator();
        displayResponse('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function detectWeatherQuery(message) {
    if (!message) {
        return {
            isWeatherQuery: false,
            location: null
        };
    }

    const messageLower = message.toLowerCase();
    const isWeatherQuery = WEATHER_KEYWORDS.some(keyword =>
        messageLower.includes(keyword)
    );

    let location = null;
    if (isWeatherQuery) {
        const inMatch = messageLower.match(/(?:in|at|for)\s+([a-zA-Z\s]+)$/);
        if (inMatch) {
            location = inMatch[1].trim();
        }
    }

    return {
        isWeatherQuery,
        location: location
    };
}

async function processWeatherRequest(location) {
  try {
      const weatherData = await fetchWeatherData(location);
      return formatWeatherResponse(weatherData);
  } catch (error) {
      console.error('Error fetching weather:', error);
      return `Sorry, I couldn't retrieve the weather information for ${location}. Please check the city name and try again.`;
  }
}

async function fetchWeatherData(location) {
  const url = `${WEATHER_API_BASE_URL}?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
      throw new Error(`Weather API request failed with status: ${response.status}`);
  }
  
  return await response.json();
}

function formatWeatherResponse(weatherData) {
  if (!weatherData || !weatherData.main || !weatherData.weather) {
      throw new Error('Invalid weather data format');
  }

  const { name, main, weather, wind } = weatherData;
  return `
      Current weather in ${name}:
      Temperature: ${Math.round(main.temp)}°C
      Condition: ${weather[0].description}
      Humidity: ${main.humidity}%
      Wind: ${Math.round(wind.speed * 3.6)} km/h
  `.trim();
}

async function processGeneralRequest(message) {
  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              contents: [{
                  parts: [{
                      text: message
                  }]
              }]
          })
      });

      if (!response.ok) {
          throw new Error(`Gemini API request failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0].content.parts[0].text) {
          throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
  } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Sorry, I couldn\'t process your request.';
  }
}

function displayResponse(message, sender) {
    const chatContainer = document.querySelector('.chatbot-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const messageText = typeof message === 'object' ?
        JSON.stringify(message, null, 2) : message;

    messageElement.textContent = messageText;
    chatContainer.appendChild(messageElement);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.textContent = 'Typing...';
    document.querySelector('.chatbot-box').appendChild(indicator);
}

function hideTypingIndicator() {
    const indicator = document.querySelector('#typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
});