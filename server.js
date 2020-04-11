'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const PORT = process.env.PORT;
const app = express();

app.use(cors());

app.get( '/test', (request, response) => {
  const name = request.query.name;
  response.send(`Hello ${name}`);
});

app.get('/location', handleLocation);

function handleLocation( request, response ) {
  try {
    let city = request.query.city;
    let locationData = require('./data/geo.json');
    let location = new Location(city, locationData[0]);
    // throw 'Location does not exist';
    response.json(location);
  }
  catch(error) {
    let errorObject = {
      status: 500,
      responseText: error,
    };
    response.status(500).json(errorObject);
  }
}

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

app.get('/weather', handleWeather);

function handleWeather(request, response) {
  let weatherData = require('./data/darksky.json');
  let dailyWeather = [];
  
  weatherData.daily.data.forEach( day => {
    let forecast = new DailyForecast(day);
   dailyWeather.push(forecast);
  });
  response.json(dailyWeather);
}

function DailyForecast(day) {
  this.forecast = day.summary;
  this.time = day.time;
}

app.listen( PORT, () => console.log('Server is up on', PORT));