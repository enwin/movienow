/* jshint latedef: false */
const mongoose = require( 'mongoose' ),
      Schema = mongoose.Schema,
      geocoder = require( 'geocoder' ),
      config = require( '../config' );

const geocodeOptions = {
  key: config.googleToken
};

// Settings
const theatersSchema = new Schema( {
  id: { type: String, index: { unique: true, dropDups: true } },
  name: String,
  address: {
    city: String,
    street: String,
    zip: String
  },
  phone: String,
  map: String,
  coord: {
    lat: Number,
    lng: Number
  }
} );

mongoose.model( 'theaters', theatersSchema );

const TheaterDb = mongoose.model( 'theaters' );

const get = ( theater ) => {
  return new Promise( ( resolve, reject ) => {

    TheaterDb.findOne( { id: theater.id }, ( err, theater ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( theater );
    } );
  } );
};

module.exports.get = get;

const add = ( theater ) => {
  let savedObject;

  return get( theater )
    .then( theaterFound => {
      // send the stored theater
      if( theaterFound ){
        savedObject = theaterFound.toObject();

        delete savedObject._id;
        delete savedObject._v;

        return theaterFound.toObject();
      }

      // otherwise clean, upgrade and save
      if( !theater.coord ){
        return theaterMap( theater )
          .then( location => {
            return save( Object.assign( theater, location ) );
          } );
      }
      else{
        return save( theater );
      }
    } );
};

module.exports.add = add;

const save = ( theater ) => {
  let toSave = Object.assign( {}, theater ),
      savedObject;

  delete toSave.movies;

  return new Promise( ( resolve, reject ) => {
    let newtheater = new TheaterDb( toSave );

    newtheater.save( ( err ) => {
      if( err ){
        reject( err );
        return;
      }

      savedObject = newtheater.toObject();

      delete savedObject._id;
      delete savedObject._v;

      resolve( savedObject );

    } );
  } );
};

const theaterMap = ( theater ) => {

  return new Promise( resolve => {
    geocoder.geocode( theater.address, ( err, data ) => {

      if( err || !data.results.length ){
        resolve( {
          coord: {}
        } );
        return;
      }
      resolve( {
        coord: data.results[0].geometry.location
      } );
    }, geocodeOptions );
  } );

};

module.exports.theaterMap = theaterMap;

const update = ( theaterId, updates ) => {
  return new Promise( ( resolve, reject ) => {
    TheaterDb.update( { id: theaterId }, updates, ( err, theater ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( theater );

    } );
  } );
};

module.exports.update = update;
