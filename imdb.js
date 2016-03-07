var imdb = require( './server/helpers/imdb' );

imdb( 'Chocolat' )
  .then( e => console.log( e ) );
