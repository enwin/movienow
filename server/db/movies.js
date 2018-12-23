/* jshint latedef: false */
const mongoose = require( 'mongoose' ),
      Schema = mongoose.Schema;

// Settings
const moviesSchema = new Schema( {
  id: { type: String, index: { unique: true, dropDups: true } },
  imdbId: String,
  title: String,
  poster: String,
  imgSrc: String,
  rating: String,
  runtime: String,
  cast: Array,
  description: String,
  genre: Array,
  director: Array,
  year: String,
  defaultPoster: { type: Boolean, default: false },
  trailer: String
} );

mongoose.model( 'Movies', moviesSchema );

const MovieDb = mongoose.model( 'Movies' );

function formatResponse( movie ){

  if( !movie ){
    return;
  }

  movie = movie.toObject();

  delete movie.__v;
  delete movie._id;

  return movie;
}

function get( getParams ){

  return MovieDb.findOne( getParams )
    .then( formatResponse )
    .catch( err => {
      console.error( 'Movie DB get', err );
    } );
}

module.exports.get = get;

function store( movie, country ){
  if( !movie.imdbId ){
    movie.imdbId = movie.id;
    movie.id = movie.id.replace( 'tt', country );
  }
  //
  return MovieDb.findOne( { id: movie.id } )
    .then( movieDoc => {
      if( !movieDoc ){
        movieDoc = new MovieDb( movie );
      }
      else{
        Object.assign( movieDoc, movie );
      }

      return movieDoc.save();
    } )
    .then( formatResponse )
    .catch( err => {
      console.error( 'Movie DB store', err );
    } );
}

module.exports.store = store;

function update( query, data ){
  return MovieDb.findOne( query )
    .then( movieDoc => {
      Object.assign( movieDoc, data );

      return movieDoc.save();
    } )
    .then( formatResponse )
    .catch( err => {
      console.error( 'Movie DB update', err );
    } );
}

module.exports.update = update;
