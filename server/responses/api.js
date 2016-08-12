'use strict';

var api = require( './showtimes' ),
    geocoder = require( 'geocoder' ),
    _flatten = require( 'lodash/flatten' ),
    _uniqBy = require( 'lodash/uniqBy' ),
    _sortBy = require( 'lodash/sortBy' ),
    slug = require( 'slug' ),
    slack = require( '../helpers/slack' ),
    unSlug = /\s/gi,
    citySanitize = require( '../helpers/city' ).sanitize,
    config = require( '../config' ),
    apiStore = {};

function parseAround( data ){
  var movies = [];

  data.forEach( theater => {
    movies.push( theater.movies.slice() );
    delete theater.movies;
  } );

  return {
    theaters: data,
    movies: _sortBy( _uniqBy( _flatten( movies ), 'id' ), 'name' )
  };

}

function parseGeo( result ){

  var types = [ 'sublocality', 'locality', 'administrative_area_level_1', 'country' ],
      name = [ 'closest', 'city', 'area', 'country' ],
      geo = {},
      match;

  types.forEach( ( type, index ) => {
    match = result.find( component => component.types.indexOf( type ) > -1 );

    if( 1 === index && !match ){
      match = result.find( component => component.types.indexOf( 'sublocality' ) > -1 );
    }

    if( match ){
      geo[ name[ index ] ] = {
        short: match.short_name,
        long: match.long_name,
        slug: slug( match.long_name.toLowerCase() )
      };
    }
  } );


  return geo;
}

function send500( req, res, e ){

  res.status( 500 ).send( {
    error: {
      code: 500,
      message: typeof( e ) !== 'object' ? e : null
    }
  } );

  if( config.dev ){
    return;
  }

  var fields = [ {
      title: 'url',
      value: req.url
    }, {
      title: 'api lang',
      value: req.get( 'accept-language' ),
      short: true
    }, {
      title: 'lang',
      value: req.session.lang,
      short: true
    }
  ],
  body = JSON.stringify( req.body, null, 2 );

  if( req.headers[ 'x-movienow-coords' ] ){
    fields.push( {
      title: 'coords',
      value: req.headers[ 'x-movienow-coords' ]
    } );
  }

  if( req.headers[ 'x-movienow-location' ] ){
    fields.push( {
      title: 'location',
      value: req.headers[ 'x-movienow-location' ]
    } );
  }

  if( body.length > 2 ){
     fields.push( {
      title: 'body',
      value: body
    } );
  }

  if( 'object' === typeof( e ) ){
    for( var key in e ){
      fields.push( {
        title: key,
        value: e[ key ]
      } );
    }
  }

  slack.webhook({
    username: '500',
    attachments: [
      {
        fallback: e.message || e,
        text: e.message || e,
        pretext: 'API error',
        color: 'danger',
        fields: fields
      }
    ]
  }, () => {} );
}

function send( res, cache ){

  for( var key in cache.headers ){
    res.setHeader( key, cache.headers[ key ] );
  }

  res.send( cache.data );
}

module.exports.cache = ( req, res, next ) => {

  let url = req.url.replace( '?', '/' ),
      lang = req.get( 'accept-language' ).split( '-' )[0],
      path = `${lang}${url}`;

  if( apiStore[ path ] ){
    if( req.headers[ 'if-modified-since' ] ){
      res.status( 304 ).end();
    }
    else{
      send( res, apiStore[ path ] );
    }
    return;
  }

  res.cacheSend = data => {
    apiStore[ path ] = {
      headers: {
        'Cache-Control': `public, max-age=${10 * 60 * 60 * 24 * 363}`,
        'Last-Modified': new Date().toUTCString(),
        'Expires': new Date( Date.now()+ (1000 * 60 * 60 * 24 * 363) ).toUTCString(),
      },
      data: data
    };

    send( res, apiStore[ path ] );
  };

  next();
};

module.exports.theaters = ( req, res ) => {
  let lang = req.get( 'accept-language' ).split( '-' )[0];
  if( req.params.id ){
    api.getTheater( req.params.where.replace( unSlug, ' ' ), req.params.id, lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getTheaters( req.params.where.replace( unSlug, ' ' ), lang )
    .then( data => res.cacheSend( data ) )
    .catch( e => send500( req, res, e ) );
  }
};


module.exports.movies = ( req, res ) => {
  let lang = req.get( 'accept-language' ).split( '-' )[0];
  if( req.params.id ){
    api.getMovie( req.params.where.replace( unSlug, ' ' ), req.params.id, lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getMovies( req.params.where.replace( unSlug, ' ' ), lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
};

module.exports.around = ( req, res ) => {
  var coords = req.headers[ 'x-movienow-coords' ] ? JSON.parse( req.headers[ 'x-movienow-coords' ] ) : null,
      location = req.headers[ 'x-movienow-location' ],
      geocode,
      data = {};

  if( location ){
    location = citySanitize( location );
  }

  if( coords ){
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.reverseGeocode( coords[ 0 ], coords[ 1 ], ( err, data ) => {
        var result = data.results[ 0 ].address_components;
        if( err ){
          reject( err );
          return;
        }

        resolve( parseGeo( result ) );
      } );
    } );
  }
  else{
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.geocode( location, ( err, data ) => {
        var result = data.results[ 0 ].address_components;
        if( err ){
          reject( err );
          return;
        }

        resolve( parseGeo( result ) );
      });
    } );
  }

  geocode
    .then( geo => {

      data.geo = geo;

      return api.getTheaterAround( coords ? coords.join() : geo.closest ? geo.closest.long : geo.city.long, req.get( 'accept-language' ).split( '-' )[0] )
        .then( data => {
          // fallback to closest interest point if passing coords doesnt work
          if( coords &&  ( !data || !data.length ) ){
            return api.getTheaterAround( geo.closest ? geo.closest.long : geo.city.long, req.get( 'accept-language' ).split( '-' )[0] );
          }

          return data;
        } )
        .then( parseAround );
    } )
    .then( aroundLists => {

      Object.assign( data, aroundLists );

      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( data );
    } )
    .catch( e => send500( req, res, e ) );

};
