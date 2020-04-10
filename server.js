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
  let city = request.query.city;
  let locationData = require('./data/geo.json');
  let location = new Location(city, locationData[0]);
  response.json(location);
}

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

app.listen( PORT, () => console.log('Server is up on ', PORT));