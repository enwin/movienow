var response = require( './responses/base' ),
    showtimes = require( './responses/api' );

module.exports = function( app ){

  // set session jade vars
  app.use( response.lang );

  // home
  app.get( '/', response.home );
  app.get( '/favorites', response.favorites );
  app.get( '/theaters(/:id)?', response.theaters );
  app.get( '/movies(/:id)?', response.movies );
  app.get( '/around', response.around );


  app.get( '/api/theaters(/:id)?', showtimes.theaters );
  app.get( '/api/movies(/:id)?', showtimes.movies );
  app.get( '/api/aroundme', showtimes.around );

};
