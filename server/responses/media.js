'use strict';

var movies = require( '../db/movies' ),
    imdbId = require( '../helpers/imdb' );

const reImbd = /\/(tt.*)\//;

var fetchPoster = function( data ){
  return imdbId.poster( data.imdb )
    .then( poster => {
      return {
        imdb: data.imdb.match( reImbd )[1],
        poster: poster
      };
    } )
    .catch( () => {
      // fallback to name search
      return findPoster( data.name );
    } );
};

var findPoster = function( name ){
  return imdbId.find( name )
    .then( imdb => {
      return {
        imdb: imdb.id,
        poster: imdb.poster || 'none'
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

  if( data.imdb ){
    poster = fetchPoster( data );
  }
  else{
    poster = findPoster( data.name );
  }

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
