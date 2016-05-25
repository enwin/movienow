var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema;

// Settings
var citySchema = new Schema( {
  slug: { type: String, index: { unique: true, dropDups: true } },
  map: String
} );

mongoose.model( 'CityMap', citySchema );

var cityDb = mongoose.model( 'CityMap' );

var get = ( city ) => {
  return new Promise( ( resolve, reject ) => {

    cityDb.findOne( { slug: city.slug }, ( err, city ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( city );
    } );
  } );
};

module.exports.get = get;

var add = ( city ) => {

  console.log( 'add', city.slug );
  return new Promise( ( resolve, reject ) => {

    get( city.slug )
      .then( ( cityFound ) => {
        if( cityFound ){
          resolve( cityFound );
          return;
        }

        var newcity = new cityDb( city );

        newcity.save( ( err ) => {
          if( err ){
            reject( err );
            return;
          }
          resolve( newcity );

        } );
      } );
  } );
};

module.exports.add = add;

var update = ( citySlug, updates ) => {
  return new Promise( ( resolve, reject ) => {
    cityDb.update( { slug: citySlug }, updates, ( err, city ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( city.toObject() );

    } );
  } );
};

module.exports.update = update;
