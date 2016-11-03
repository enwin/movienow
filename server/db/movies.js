var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema;

// Settings
var moviesSchema = new Schema( {
  id: { type: String, index: { unique: true, dropDups: true } },
  title: String,
  poster: String,
  imgSrc: String,
  rating: String,
  runtime: Number,
  description: String,
  genre: Array,
  director: String,
  year: String,
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
  return new Promise( ( resolve, reject ) => {

    get( movie )
      .then( ( movieFound ) => {
        if( movieFound ){
          resolve( movieFound );
          return;
        }

        var newMovie = new movieDb( movie );

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
