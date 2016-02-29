'use strict';

var moment = require( 'moment' );

var Showtimes = require( 'showtimes' ),
    _clone = require( 'lodash/cloneDeep' ),
//import artwork from 'movie-art';

    showTimes = new Showtimes( '48.8698768,2.3469172', {
      lang: 'en',
      date: 0
    } ),
    showTimesDate1 = new Showtimes( '48.8698768,2.3469172', {
      lang: 'en',
      date: 1
    } ),
    showTimesDate2 = new Showtimes( '48.8698768,2.3469172', {
      lang: 'en',
      date: 2
    } );

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
        theater;

    return new Promise( ( resolve, reject ) => {
      showTimes = new Showtimes( '48.8698768,2.3469172', {
        lang: 'en',
        date: 0
      } );

      api.getTheater( tid, showTimes )
        .then( result => {
          console.log( result.id )
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
    return new Promise( (resolve, reject) => {
      showTimes.getMovie( mid, ( err, result ) => {
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
      // decide if we use cache or refresh
      if( null === it.store.moviesDay || ( it.store.moviesDay && it.day === 3 )  ){
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

        resolve( result );
      } );
    } );
  }

  getTheaters () {
    var it = this;
    return new Promise( (resolve, reject) => {
      // fetch new info once a day
      if( null === it.store.theatersDay || it.store.theatersDay + 1 === it.day ){
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
};

module.exports = new api();
