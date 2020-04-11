'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const PORT = process.env.PORT;
const app = express();
const superagent = require('superagent');

app.use(cors());

app.get('/location', handleLocation);
app.get('/weather', handleWeather);

function handleLocation( request, response ) {
  try {
    let city = request.query.city;
    
    //https://us1.locationiq.com/v1/search.php?key=YOUR_PRIVATE_TOKEN&q=SEARCH_STRING&format=json
    const url = 'https://us1.locationiq.com/v1/search.php';
    const queryStringParams = {
      key: process.env.LOCATIONIQ,
      q: city,
      format: 'json',
      limit: 1,
    }

    superagent.get(url)
    .query(queryStringParams)
      .then(data => {
        let locationData = data.body[0];
        let location = new Location(city, locationData);
    // throw 'Location does not exist';
    response.json(location);
      })
    
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

function handleWeather(request, response) {
  let weatherData = require('./data/darksky.json');
  let dailyWeather = [];
  
  weatherData.daily.data.map( day => {
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