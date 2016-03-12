var movies = require( '../db/movies' ),
    imdbId = require( '../helpers/imdb' );

var handleMovieDb = function( data ){
  if( data && data.poster ){
    return data;
  }

  return new Promise( ( resolve, reject ) => {

    function save ( info ){
      movies.update( data.id, info )
        .then( () => {
          resolve( info );
        } )
        .catch( reject );
    }

    imdbId( data.name )
      .then( imdb => {
        save( {
          imdb: imdb.id,
          poster: imdb.poster || false
        } );
      } )
      .catch( () => {
        console.log( 'catch' );
        save( {
          poster: false
        } );
      } );
  } );

};

module.exports.poster = function( req, res ){
  movies.get( { id: req.params.id } )
    .then( handleMovieDb )
    .then( data => {
      if( data.poster ){
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
