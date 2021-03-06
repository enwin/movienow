/* global process: true, console: true */
  var config = require( './server/config' ),
      express = require( 'express' );

  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  if( 'development' === process.env.NODE_ENV ){
    config.dev = true;
  }

  config.port = config.dev ? 4000 : config.port;

  var app = express();

  app.locals.config = config;

  // server handling
  require( './server/express' )( app, config );

  // routes handling
  require( './server/routes' )( app, config );

  app.listen( config.port );

  console.log( 'Started on port '+ config.port );