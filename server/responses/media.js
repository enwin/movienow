var movies = require( '../db/movies' ),
    imdbId = require( '../helpers/imdb' );

var handleMovieDb = function( data ){
  if( data && data.poster ){
    return data;
  }

  return new Promise( ( resolve, reject ) => {

    imdbId( data.name )
      .then( imdb => {
        console.log( imdb.poster );
        movies.update( data.id, {
          poster: imdb.poster ? imdb.poster : '/media/posters/default.png'
        } )
          .then( () => {
            resolve( imdb );
          } );
      } )
      .catch( reject );
  } );

};

module.exports.poster = function( req, res ){
  movies.get( {id: req.params.id } )
    .then( handleMovieDb )
    .then( data => {
      res.redirect( data.poster );
    } );
};
