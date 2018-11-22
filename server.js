'use strict';


// Application Dependencies
const express = require('express'); //telling app to use the express library
const superagent = require('superagent');  //telling app to use the superagent proxy
const cors = require('cors');  //telling app to use the CORS library

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data) //the clients input that is given to the proxy to talk to the API.
    .then(location => response.send(location)) //awaits response from superagent before responding to client 
    .catch(error => handleError(error, response)); //is there is an error it will call this function which return the error message
})

app.get('/weather', getWeather);

app.get('/movies', getMovies);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models
function Location(query, res) {
  this.search_query = query;  
  this.formatted_query = res.body.results[0].formatted_address; 
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Movie(query) {
  this.title = query.title;
  this.released_on = query.release_date;
  this.total_votes = query.vote_count;
  this.average_votes = query.vote_average;
  this.popularity = query.popularity;
  this.image_url = ('http://image.tmdb.org/t/p/w185/'+query.poster_path);
  this.overview = query.overview;
  console.log(this);
}


// Helper Functions
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMovies(query,response) {
  const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${query}`;
  //hint request.query.data.search_query

  superagent.get(movieUrl)
    .then(resultFromSuper => {
      // console.log('result', resultFromSuper.body.results)
      const movieSummaries = resultFromSuper.body.results.map(movieItem => {
        return new Movie(movieItem);
      });
      response.send(movieSummaries);
    })
    .catch(error => handleError(error, response));
}

//hint for yelp
//  look at superagent docs
//  will use superagent.set after superagent.get
//  the api key isn't used in the URL

