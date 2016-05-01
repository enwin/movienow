'use strict';

var moment = require( 'moment' );

var movieDB = require( '../db/movies' ),
    theaterdDB = require( '../db/theaters' );

var Showtimes = require( 'showtimes' ),
    _clone = require( 'lodash/cloneDeep' );

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
  }

  getTheaterPlannig ( where, tid ){
    var api = this,
        days = [],
        index = 0,
        p,
        theater;

    while( index < 3 ){
      p = api.getTheater( where, tid, { lang: 'fr', date: index } );
      days.push( p );
      index++;
    }

    return Promise.all( days )
      .then( results => {
        results.forEach( ( result, index ) => {
          if( !index ){
            theater = _clone( result );
            delete theater.movies;
            theater.movies = [ result.movies ];
          }
          else{
            theater.movies.push( result.movies );
          }
        } );

        return theater;
      } );
  }

  getMovie ( where, mid, lang ) {
    var showtimes = new Showtimes( where, {
      lang: lang || 'fr',
      date: 0
    } );

    return new Promise( (resolve, reject) => {
      showtimes.getMovie( mid, ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }
        saveMovies( [ result ] );
        resolve( result );
      } );
    } );
  }

  getMovies ( where, lang ) {
    return new Promise( (resolve, reject) => {

      var showtimes = new Showtimes( where, {
        lang: lang || 'fr',
        date: 0
      } );

      showtimes.getMovies( ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        saveMovies( result );
        resolve( result );
      } );
    } );
  }

  getTheater ( where, tid, params ) {
    return new Promise( (resolve, reject) => {

      var showtimes = new Showtimes( where, params || {
        lang: 'fr',
        date: 0
      } );

      showtimes.getTheater( tid, ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        // theaterdDB.add( result )
        //   .then( theater => {

        //     Object.assign( result, theater );

            saveMovies( result.movies );

            resolve( result );

          // } )
          // .catch( console.log );

      } );
    } );
  }

  getTheaters ( where ) {

    return new Promise( (resolve, reject) => {

      var showtimes = new Showtimes( where, {
        lang: 'fr',
        date: 0
      } );

      showtimes.getTheaters( ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        resolve( result );
      } );
    } );
  }

  getTheaterAround ( location ){

    var around = new Showtimes( location, {
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
