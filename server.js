const config = require( './server/config' );
const express = require( 'express' );
const mongoConnect = require( './server/db' );
const pkg = require( './package.json' )
require( './server/helpers/slack' );

function start(){
  config.port = config.dev ? 4000 : config.port;

  const app = express();

  app.locals.config = config;

  // server handling
  require( './server/express' )( app, config );

  // routes handling
  require( './server/routes' )( app, config );

  app.listen( config.port );

  console.log( `${pkg.name} started on port ${config.port}` );
}

mongoConnect( config ).then( () => start() )
  .catch( err => {
    console.log( err );
  } );
