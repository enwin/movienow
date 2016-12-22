const config = require( './server/config' ),
    express = require( 'express' );

require( './server/helpers/slack' );

config.port = config.dev ? 4000 : config.port;

const app = express();

app.locals.config = config;

// database
require( './server/db' )();

// server handling
require( './server/express' )( app, config );

// routes handling
require( './server/routes' )( app, config );

app.listen( config.port );

console.log( 'Started on port '+ config.port );
