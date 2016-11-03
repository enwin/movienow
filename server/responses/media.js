'use strict';

var movies = require( '../db/movies' ),
    imdbId = require( '../helpers/imdb' );

var fetchPoster = function( data ){
  return imdbId.poster( data.imgSrc )
    .then( poster => {
      return {
        poster: poster
      };
    } )
    .catch( () => {
      return {
        poster: 'none'
      };
    } );
};

var handleMovieDb = function( data ){
  let poster;

  if( data && data.poster ){
    return data;
  }

  poster = fetchPoster( data );

  return poster
    .then( info => {
      return movies.update( data.id, info )
        .then( () => info );
    } );

};

module.exports.poster = function( req, res ){
  movies.get( { id: req.params.id } )
    .then( handleMovieDb )
    .then( data => {
      if( data.poster !== 'none' ){
        var img = new Buffer( data.poster, 'base64' );
        res.setHeader( 'Content-Type', 'image/jpeg');
        res.setHeader( 'Content-Length', img.length );
        res.end( img );
      }
      else{
        res.redirect( '/media/posters/default.png' );
      }
    } );
};
