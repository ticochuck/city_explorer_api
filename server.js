'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const PORT = process.env.PORT;
const app = express();
const pg = require('pg');
const superagent = require('superagent');
const client = new pg.Client(process.env.DATABASE_URL);

client.connect();
app.use(cors());

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/movies', handleMovies);

function handleLocation( request, response ) {
  let city = request.query.city.toLowerCase(); 
  const url = 'https://us1.locationiq.com/v1/search.php';
  const queryStringParams = {
      key: process.env.LOCATIONIQ,
      q: city,
      format: 'json',
      limit: 1,
    }
    
    const searchSQL = `
      SELECT * FROM locations 
      WHERE search_query = $1
    `;
    const searchValues =[city]

    client.query(searchSQL, searchValues)
      .then( results => {
        if (results.rowCount >= 1 ) {
          console.log('Response came from Database - Row count = ' + results.rowCount);
          response.json(results.rows[0]);
          
        } else {
          superagent.get(url)
          .query(queryStringParams)
          .then(data => {
            let locationData = data.body[0];
            let location = new Location(city, locationData);
            console.log(city + ' came from API')
            const addSQL = `
            INSERT INTO locations (search_query, formatted_query, latitude, longitude)  
            VALUES($1, $2, $3, $4)
          `;
            let VALUES = [location.search_query, location.formatted_query, location.latitude, location.longitude];
            client.query(addSQL, VALUES)
            .then( result => {
              console.log(VALUES);
              response.json(location);
            });
          })
        }    
      })
   .catch(error => {
    let errorObject = {
      status: 500,
      responseText: 'Something went wrong',
    };
    response.status(500).json(errorObject);
  })
  
}

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function handleWeather(request, response) {
  let key = process.env.DARK_SKY_KEY;
  let lat = request.query.latitude;
  let lon = request.query.longitude;
  let url = `https://api.darksky.net/forecast/${key}/${lat},${lon}`;
  
  superagent.get(url)
  .then(data => {
    let weatherData = data.body.daily.data.map( day => {
      return new DailyForecast(day);
    })
    response.json(weatherData);
  });
}

function DailyForecast(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time*1000).toUTCString();
}

function handleTrails (request, response) {
  const url = 'https://www.hikingproject.com/data/get-trails';
  const queryStringParams = {
    key: process.env.HIKING_API,
    lat: request.query.latitude,
    lon: request.query.longitude,
    maxResults: 10,
  }
  superagent.get(url)
  .query(queryStringParams)
  .then(data => {
    let trailsData = data.body.trails.map( trail => {
      return new Hike(trail);
    })
    response.json(trailsData);
  })
}

function Hike(trail){
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionDetails;
  this.condition_date = trail.conditionDate.substring(0,10);
  this.condition_time = trail.conditionDate.substring(11,20);
}

function handleMovies(req, res) {
  let key = process.env.MOVIE_API_KEY;
  let region = req.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${region}&$include_adult=false`
  // const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&language=en-US&query=${region}&page=1&include_adult=false`
  superagent.get(url) 
  .then(data => {
  let movieData = data.body.results.map( movie => {
      return new Movie(movie);
    })
  res.json(movieData);
}) 
}

function Movie (movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes= movie.vote_count;
  this.image_url= `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on= movie.release_date;
}

app.listen( PORT, () => console.log('Server is up on', PORT));
