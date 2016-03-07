'use strict';

var moment = require( 'moment' );

var movieDB = require( '../db/movies' );

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
    this.store = {};
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

  getMovie ( where, mid ) {
    var showtimes = new Showtimes( where, {
      lang: 'fr',
      date: 0
    } );

    return new Promise( (resolve, reject) => {
      showtimes.getMovie( mid, ( err, result ) => {
        if( err ){
          reject( err );
          return;
        }

        resolve( result );
      } );
    } );
  }

  getMovies ( where ) {
    var it = this;
    return new Promise( (resolve, reject) => {

      var showtimes = new Showtimes( where, {
        lang: 'fr',
        date: 0
      } );

      // fetch new info once a day
      if( !it.store[ where ] || it.store[ where ].moviesDay !== it.day  ){
        showtimes.getMovies( ( err, result ) => {
          if( err ){
            reject( err );
            return;
          }

          if( !it.store[ where ] ){
            it.store[ where ] = {
              movies: [],
              moviesDay: null,
              theaters: [],
              theatersDay: null
            };
          }

          it.store[ where ].movies = result;
          it.store[ where ].moviesDay = it.day;

          resolve( result );
        } );
      }
      else{
        resolve( it.store[ where ].movies );
      }
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

        saveMovies( result.movies );

        resolve( result );
      } );
    } );
  }

  getTheaters ( where ) {
    var it = this;

    return new Promise( (resolve, reject) => {
      // fetch new info once a day
      if( !it.store[ where ] || it.store[ where ].theatersDay !== it.day ){

        var showtimes = new Showtimes( where, {
          lang: 'fr',
          date: 0
        } );

        showtimes.getTheaters( ( err, result ) => {
          if( err ){
            reject( err );
            return;
          }

          if( !it.store[ where ] ){
            it.store[ where ] = {
              movies: [],
              moviesDay: null,
              theaters: [],
              theatersDay: null
            };
          }

          it.store[ where].theaters = result;
          it.store[ where].theatersDay = it.day;

          resolve( result );
        } );
      }
      else{
        resolve( it.store[ where ].theaters );
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
