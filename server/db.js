const mongoose = require( 'mongoose' );

mongoose.Promise = global.Promise;

require( './db/movies' );

module.exports = function( config ){

  // Bootstrap db connection
  // Connect to mongodb
  const options = { useMongoClient: true, keepAlive: 1 };

  return mongoose.connect( config.db, options );

};
