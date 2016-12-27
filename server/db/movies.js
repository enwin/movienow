/* jshint latedef: false */
const mongoose = require( 'mongoose' ),
      Schema = mongoose.Schema;

// Settings
const moviesSchema = new Schema( {
  id: { type: String, index: { unique: true, dropDups: true } },
  title: Object,
  poster: String,
  imgSrc: String,
  rating: String,
  runtime: String,
  cast: String,
  description: String,
  genre: Array,
  director: String,
  year: String,
  defaultPoster: { type: Boolean, default: false }
} );

mongoose.model( 'Movies', moviesSchema );

const MovieDb = mongoose.model( 'Movies' );

function get( movie ){
  return new Promise( ( resolve, reject ) => {

    MovieDb.findOne( { id: movie.id }, ( err, movie ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( movie );
    } );
  } );
}

module.exports.get = get;

function add( movie, country ){
  return new Promise( ( resolve, reject ) => {

    let countryTitle = {};
    countryTitle[ country ] = movie.title;

    get( movie )
      .then( movieFound => {
        // console.log( 'movie found', movieFound );
        if( movieFound ){
          if( movieFound.title[ country ] ){
            resolve( movieFound );
            return;
          }
          else{
            return update( movieFound.id, {
              title: Object.assign( movieFound.title, countryTitle )
            } );
          }
        }

        movie.title = countryTitle;

        var newMovie = new MovieDb( movie );

        newMovie.save( ( err ) => {
          if( err ){
            reject( err );
            return;
          }

          let movie = newMovie.toObject();

          movie.title = movie.title[ country ];

          resolve( movie );
        } );
      } );
  } );
}

module.exports.add = add;

function update( movieId, updates ){
  return new Promise( ( resolve, reject ) => {
    MovieDb.update( { id: movieId }, updates, ( err, movie ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( movie );

    } );
  } );
}

module.exports.update = update;
