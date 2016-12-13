'use strict';

var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema,
    geocoder = require( 'geocoder' ),
    config = require( '../config' ),
    request = require( 'request-promise' );

// Settings
var theatersSchema = new Schema( {
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

var theaterDb = mongoose.model( 'theaters' );

var get = ( theater ) => {
  return new Promise( ( resolve, reject ) => {

    theaterDb.findOne( { id: theater.id }, ( err, theater ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( theater );
    } );
  } );
};

module.exports.get = get;

var add = ( theater ) => {
  var savedObject;

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

var save = ( theater ) => {
  var toSave = Object.assign( {}, theater ),
      savedObject;

  delete toSave.movies;

  return new Promise( ( resolve, reject ) => {
    var newtheater = new theaterDb( toSave );

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

var theaterMap = ( theater ) => {

  return new Promise( ( resolve, reject ) => {
    geocoder.geocode( theater.address, ( err, data ) => {

      if( err || !data.results.length ){
        //reject( err || data );
        resolve( {
          coord: {}
        } );
        return;
      }
      resolve( {
        coord: data.results[0].geometry.location
      } );
    } );
  } );

  // return geocode.then( coord => {
  //   // return a base64 of the image
  //   return request( {
  //     uri: `https://api.mapbox.com/styles/v1/enwin/cilc1wlfh0023bekqea6ijgm1/static/${coord.lng},${coord.lat},14.5,0,0/720x1280@2x?access_token=${config.mapToken}&attribution=false&logo=false`,
  //     headers: {
  //       'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  //     },
  //     encoding: 'binary',
  //     transform: ( body ) => {
  //       return  {
  //         coord: coord,
  //         map: `data:image/png;base64,${ new Buffer( body, 'binary' ).toString( 'base64' )}`
  //       };
  //     }
  //   } );
  // } );

};

module.exports.theaterMap = theaterMap;

var update = ( theaterId, updates ) => {
  return new Promise( ( resolve, reject ) => {
    theaterDb.update( { id: theaterId }, updates, ( err, theater ) => {
      if( err ){
        reject( err );
        return;
      }

      resolve( theater );

    } );
  } );
};

module.exports.update = update;
