/* global module: true */

var mongoose = require( 'mongoose' ),
    config = require( './config' );

require( './db/movies' );

module.exports = function(){

  // Bootstrap db connection
  // Connect to mongodb

  var options = { server: { socketOptions: { keepAlive: 1 } } };

  mongoose.connect( config.db, options, function( err ){
    if( err ){
      console.log( err );
    }
  } );

  // Error handler
  mongoose.connection.on('error', function(err){
    console.log(err);
  });

};
