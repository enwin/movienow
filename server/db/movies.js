var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema;

// Settings
var moviesSchema = new Schema( {
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

var add = ( movie, country ) => {
  return new Promise( ( resolve, reject ) => {

    let countryTitle = {};
    countryTitle[ country ] = movie.title;

    if( movie.id === 'tt3183660' ){
      console.log( 'add movie', countryTitle, movie.title );
    }

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

        var newMovie = new movieDb( movie );

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
