/* global module: true, global: true */
var mongoose = require( 'mongoose' ),
    config = require( './config' );

mongoose.Promise = global.Promise;

require( './db/movies' );

module.exports = function( callback ){

  // Bootstrap db connection
  // Connect to mongodb

  var options = { server: { socketOptions: { keepAlive: 1 } } };

  mongoose.connect( config.db, options, function( err ){
    if( err ){
      console.error( err );
      return;
    }
    if( callback ){
      callback();
    }
  } );

  // Error handler
  mongoose.connection.on('error', function(err){
    console.error(err);
  });

};
