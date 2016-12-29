const movies = require( '../db/movies' ),
      imdbId = require( '../helpers/imdb' );

const fetchPoster = function( data ){
  return imdbId.getPoster( data.imgSrc )
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

const handleMovieDb = function( data ){
  let poster;

  if( data.poster ){
    return data;
  }

  poster = fetchPoster( data );
  return poster
    .then( info => {
      return movies.update( {id: data.id}, info )
        .then( () => info );
    } );

};

module.exports.poster = function( req, res ){
  movies.get( { imdbId: req.params.id } )
    .then( data => {
      if( !data ){
        return Promise.reject( `No movie with id "${req.params.id}" in DB` );
      }
      return data;
    } )
    .then( handleMovieDb )
    .then( data => {
      if( data.poster === 'none' ){
        return Promise.reject( `No poster found for movie "${req.params.id}"` );
      }

      const img = new global.Buffer( data.poster, 'base64' );
      res.setHeader( 'Content-Type', 'image/jpeg');
      res.setHeader( 'Content-Length', img.length );
      res.end( img );
    } )
    .catch( err => {
      console.error( 'Poster', err );
      res.redirect( '/media/posters/default.png' );
    } );
};
