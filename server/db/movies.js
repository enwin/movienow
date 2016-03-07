var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema;

// Settings
var moviesSchema = new Schema( {
  id: { type: String, index: { unique: true, dropDups: true } },
  name: String,
  imdb: String,
  poster: String,
  defaultPoster: { type: Boolean, default: false }
} );

mongoose.model( 'Movies', moviesSchema );

var movieDb = mongoose.model( 'Movies' );

var get = ( movie ) => {
  return new Promise( ( resolve, reject ) => {

    movieDb.findOne( { id: movie.id }, ( err, movie ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( movie );
    } );
  } );
};

module.exports.get = get;

var add = ( movie ) => {
  var toSave;
  return new Promise( ( resolve, reject ) => {
    toSave = {
      id: movie.id,
      name: movie.name
    };

    if( movie.imdb ){
      toSave.imdb = movie.imdb;
    }

    get( movie )
      .then( ( movieFound ) => {
        if( movieFound ){
          resolve( movieFound );
          return;
        }

        var newMovie = new movieDb( toSave );

        newMovie.save( ( err ) => {
          if( err ){
            reject( err );
            return;
          }
          resolve( newMovie.toObject() );

        } );
      } );
  } );
};

module.exports.add = add;

var update = ( movieId, updates ) => {
  return new Promise( ( resolve, reject ) => {
    movieDb.update( { id: movieId }, updates, ( err, movie ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( movie );

    } );
  } );
};

module.exports.update = update;
