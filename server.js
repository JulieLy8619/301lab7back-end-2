'use strict';


// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
})

app.get('/weather', getWeather);

app.get('/yelp', getYelp);

app.get('/movies', getMovies);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models (aka constructors)
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

function Food(place) {
  this.url = place.url;
  this.name = place.name;
  this.rating = place.rating; 
  this.price = place.price;
  this.image_url = place.image_url;
  console.log(this);
}

function Movie(query) {
  this.title = query.title;
  this.released_on = query.release_date;
  this.total_votes = query.vote_count;
  this.average_votes = query.vote_average;
  this.popularity = query.popularity;
  this.image_url = ('http://image.tmdb.org/t/p/w185/'+query.poster_path);
  this.overview = query.overview;
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

function getYelp(req, res){
  const yelpUrl = `https://api.yelp.com/v3/businesses/search?latitude=${req.query.data.latitude}&longitude=${req.query.data.longitude}`;

  superagent.get(yelpUrl)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(yelpResult => {
      console.log('yelpResult', yelpResult.body.businesses[0]);
      const yelpSummaries = yelpResult.body.businesses.map(place => {
        return new Food(place);
      });
      res.send(yelpSummaries);
    })
    .catch(error => handleError(error, res));
}

function getMovies(query,response) {
  const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${query}`;

  superagent.get(movieUrl)
    .then(resultFromSuper => {
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

// { businesses:
//   [ 
//     { id: '6I28wDuMBR5WLMqfKxaoeg',
//       alias: 'pike-place-chowder-seattle',
//       name: 'Pike Place Chowder',
//       image_url:
//        'https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg',
//       is_closed: false,
//       url:
//        'https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=QailHQ2lZirdKKJTGc9X1Q&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=QailHQ2lZirdKKJTGc9X1Q',
//       review_count: 6321,
//       categories: [Array],
//       rating: 4.5,
//       coordinates: [Object],
//       transactions: [Array],
//       price: '$$',
//       location: [Object],
//       phone: '+12062672537',
//       display_phone: '(206) 267-2537',
//       distance: 767.5659881806488 
//     }
//   ]
// }
    