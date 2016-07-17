var response = require( './responses/base' ),
    showtimes = require( './responses/api' ),
    tracker = require( './tracker' ),
    media = require( './responses/media' );

module.exports = function( app ){

  // set session jade vars
  app.use( response.lang );
  // app.use( tracker.send );

  // home
  app.get( '/', response.home );
  app.get( '/favorites', response.favorites );
  app.get( '/theaters(/:id)?', response.theaters );
  app.get( '/movies(/:id)?', response.movies );
  app.get( '/around', response.around );
  app.get( '/credits', response.credits );

  app.use( '/api/', showtimes.cache );

  app.get( '/api/theaters/:where/:id?', showtimes.theaters );
  app.get( '/api/movies/:where/:id?', showtimes.movies );
  app.get( '/api/aroundme', showtimes.around );

  app.get( '/media/poster/:id', media.poster );

  app.post( '/user', response.user );
};
