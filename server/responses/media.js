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

    if( data.imdb ){
      imdbId.poster( data.imdb )
        .then( poster => {
          save( {
            imdb: data.imdb.match( /\/(tt.*)\//)[1],
            poster: poster
          } );
        } )
        .catch( console.log );
    }
    else{
      imdbId.find( data.name )
        .then( imdb => {
          save( {
            imdb: imdb.id,
            poster: imdb.poster || 'none'
          } );
        } )
        .catch( () => {
          save( {
            poster: 'none'
          } );
        } );
    }
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
