var movies = require( '../db/movies' ),
    imdbId = require( '../helpers/imdb' );

var handleMovieDb = function( data ){
  if( data && data.poster ){
    return data;
  }

  return new Promise( ( resolve, reject ) => {

    imdbId( data.name )
      .then( imdb => {
        imdb = {
          imdb: imdb.id,
          poster: imdb.poster ? imdb.poster : '/media/posters/default.png',
          defaultPoster: !imdb.poster
        };

        movies.update( data.id, imdb )
          .then( () => {
            resolve( imdb );
          } );
      } )
      .catch( reject );
  } );

};

module.exports.poster = function( req, res ){
  movies.get( { id: req.params.id } )
    .then( handleMovieDb )
    .then( data => {
      if( !data.defaultPoster ){
        var img = new Buffer( data.poster, 'base64' );
        res.setHeader( 'Content-Type', 'image/jpeg');
        res.setHeader( 'Content-Length', img.length );
        res.end( img );
      }
      else{
        res.redirect( data.poster );
      }
    } );
};
