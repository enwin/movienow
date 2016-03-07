'use strict';

var moment = require( 'moment' );

var movieDB = require( '../db/movies' );

var Showtimes = require( 'showtimes' ),
    _clone = require( 'lodash/cloneDeep' ),
//import artwork from 'movie-art';

    showTimes = new Showtimes( 'Paris', {
      lang: 'fr',
      date: 0
    } ),
    showTimesDate1 = new Showtimes( 'Paris', {
      lang: 'fr',
      date: 1
    } ),
    showTimesDate2 = new Showtimes( 'Paris', {
      lang: 'fr',
      date: 2
    } );

/**
 * save movies to the database
 * @param  {array} movies array of movies to save
 */
var saveMovies = function( movies ){

  return Promise.all( movies.map( movie => movieDB.add( movie ) ) );
};

class api {

  constructor (){
    this.day = moment().format( 'd' );
    this.store = {
      movies: [],
      moviesDay: null,
      theaters: [],
      theatersDay: null
    };
  }

  getTheaterPlannig ( tid ){
    var api = this,
        theatersTime,
        theater;

    return new Promise( ( resolve, reject ) => {
      theatersTime = new Showtimes( '48.8698768,2.3469172', {
        lang: 'fr',
        date: 0
      } );

      api.getTheater( tid, theatersTime )
        .then( result => {
          theater = _clone( result );
          delete theater.movies;
          theater.movies = [ result.movies ];
          return api.getTheater( tid, showTimesDate1 );
        })
        .then( result => {
          theater.movies.push( result.movies );

          return api.getTheater( tid, showTimesDate2 );
        })
        .then( result => {
          theater.movies.push( result.movies );
          resolve( theater );
        })
        .catch( e => reject( e, theater ) );
    } );
  }

  getMovie ( mid ) {
    var movieTIme = new Showtimes( 'Paris', {
      lang: 'fr',
      date: 0
    } );

    return new Promise( (resolve, reject) => {
      movieTIme.getMovie( mid, ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        resolve( result );
      } );
    } );
  }

  getMovies () {
    var it = this;
    return new Promise( (resolve, reject) => {
      // fetch new info once a day
      if( it.store.moviesDay !== it.day  ){
        showTimes.getMovies( ( err, result ) => {
          if( err ){
            reject( err );
            return;
          }
          it.store.movies = result;
          it.store.moviesDay = it.day;
          resolve( result );
        } );
      }
      else{
        resolve( it.store.movies );
      }
    } );
  }

  getTheater ( tid, api ) {
    api = api || showTimes;
    return new Promise( (resolve, reject) => {
      api.getTheater( tid, ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }
        saveMovies( result.movies );

        resolve( result );
      } );
    } );
  }

  getTheaters () {
    var it = this;
    return new Promise( (resolve, reject) => {
      // fetch new info once a day
      if( it.store.theatersDay !== it.day ){
        showTimes.getTheaters( ( err, result ) => {
          if( err ){
            reject( err );
            return;
          }

          it.store.theaters = result;
          it.store.theatersDay = it.day;

          resolve( result );
        } );
      }
      else{
        resolve( it.store.theaters );
      }
    } );
  }

  getTheaterAround ( location ){

    var around = new Showtimes( location.join(), {
      pageLimit: 2,
      date: 0,
      lang: 'fr'
    } );
    return new Promise( ( resolve, reject ) => {
      around.getTheaters( ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        resolve( result );

      } );
    } );

  }
}

module.exports = new api();
