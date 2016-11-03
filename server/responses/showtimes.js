'use strict';

var moment = require( 'moment' );

var movieDB = require( '../db/movies' );
    // theaterdDB = require( '../db/theaters' );

// var Showtimes = require( 'showtimes' ),
// var _clone = require( 'lodash/cloneDeep' );

var showtimes = require( '../helpers/api' );

/**
 * save movies to the database
 * @param  {array} movies array of movies to save
 */
var saveMovies = function( movies ){
  return Promise.all( movies.map( movie => movieDB.add( movie ) ) );
};

// var saveTheaters = function( theaters ){
//   return Promise.all( theaters.map( theater => theaterDB.add( theater ) ) );
// }

class api {

  constructor (){
    this.day = moment().format( 'd' );
  }

  getMovie ( mid, zip, country ) {
    // var showtimes = new Showtimes( where, {
    //   lang: lang || 'fr',
    //   date: 0
    // } );

    // return new Promise( (resolve, reject) => {
    //   showtimes.getMovie( mid, ( err, result ) => {
    //     if( err ){
    //       reject( err );
    //       return;
    //     }
    //     saveMovies( [ result ] );
    //     resolve( result );
    //   } );
    // } );
    return showtimes.getMovie( mid, zip, country )
      .then( data => {
        saveMovies( [data] );
        return data;
      } );
  }

  getMovies ( zip, country ) {
    // return new Promise( (resolve, reject) => {

    //   var showtimes = new Showtimes( where, {
    //     lang: lang || 'fr',
    //     date: 0
    //   } );

    //   showtimes.getMovies( ( err, result ) => {
    //     if( err ){
    //       reject( err );
    //       return;
    //     }

    //     saveMovies( result );
    //     resolve( result );
    //   } );
    // } );
    // console.log( where, lang, showtimes )
    return showtimes.getMovies( zip, country )
      .then( data => {
        saveMovies( data );
        return data
      } )
  }

  getTheater ( tid, zip, country ) {
    // return new Promise( (resolve, reject) => {
    //   var showtimes = new Showtimes( where, {
    //     lang: lang || 'fr',
    //     date: 0
    //   } );

    //   showtimes.getTheater( tid, ( err, result ) => {
    //     if( err ){
    //       reject( err );
    //       return;
    //     }

    //     // theaterdDB.add( result )
    //     //   .then( theater => {

    //     //     Object.assign( result, theater );

    //         saveMovies( result.movies );

    //         resolve( result );

    //       // } )
    //       // .catch( console.error );

    //   } );
    // } );

    return showtimes.getTheaters( zip, lang )
      .then( data => data.find( theater => theater.id === tid ) );

  }

  getTheaters ( zip, country ) {

    // return new Promise( (resolve, reject) => {

    //   var showtimes = new Showtimes( where, {
    //     lang: lang || 'fr',
    //     date: 0
    //   } );

    //   showtimes.getTheaters( ( err, result ) => {
    //     if( err ){
    //       reject( err );
    //       return;
    //     }

    //     resolve( result );
    //   } );
    // } );
    return showtimes.getTheaters( zip, country );
      // .then( data => {
      //   saveTheaters( data );
      //   return data;
      // } );
  }

  getTheaterAround ( location, lang ){

    var around = new Showtimes( location, {
      pageLimit: 2,
      date: 0,
      lang: lang || 'fr'
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
