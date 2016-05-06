var api = require( './showtimes' ),
    geocoder = require( 'geocoder' ),
    _flatten = require( 'lodash/flatten' ),
    _uniqBy = require( 'lodash/uniqBy' ),
    _sortBy = require( 'lodash/sortBy' ),
    slug = require( 'slug' ),
    slack = require( '../helpers/slack' ),
    unSlug = /\s/gi,
    citySanitize = require( '../helpers/city' ).sanitize,
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

  var types = [ 'locality', 'administrative_area_level_1', 'country' ],
      name = [ 'city', 'area', 'country' ],
      geo = {},
      match;

  types.forEach( ( type, index ) => {
    match = result.find( component => component.types.indexOf( type ) > -1 );

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
  var fields = [ {
      title: 'url',
      value: req.url
    }, {
      title: 'counrty',
      value: req.session.country,
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

  res.status( 500 ).send( {
    error: {
      code: 500,
      message: typeof( e ) !== 'object' ? e : null
    }
  } );
}

function send( res, cache ){

  for( var key in cache.headers ){
    res.setHeader( key, cache.headers[ key ] );
  }

  res.send( cache.data );
}

module.exports.cache = function( req, res, next ){

  var url = req.url.replace( '?', '/' );

  if( apiStore[ url ] ){
    if( req.headers[ 'if-modified-since' ] ){
      res.status( 304 ).end();
    }
    else{
      send( res, apiStore[ url ] );
    }
    return;
  }

  res.cacheSend = function( data ){
    apiStore[ url ] = {
      headers: {
        'Cache-Control': `public, max-age=${10 * 60 * 60 * 24 * 363}`,
        'Last-Modified': new Date().toUTCString(),
        'Expires': new Date( Date.now()+ (1000 * 60 * 60 * 24 * 363) ).toUTCString(),
      },
      data: data
    };

    send( res, apiStore[ url ] );
  };

  next();
};

module.exports.theaters = function( req, res ){
  if( req.params.id ){
    api.getTheater( req.params.city.replace( unSlug, ' ' ), req.params.id, req.session.country || req.session.lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    //api.getTheaters( result );
    api.getTheaters( req.params.city.replace( unSlug, ' ' ), req.session.country || req.session.lang )
    .then( data => res.cacheSend( data ) )
    .catch( e => send500( req, res, e ) );
  }
};


module.exports.movies = function( req, res ){
  if( req.params.id ){
    api.getMovie( req.params.city.replace( unSlug, ' ' ), req.params.id, req.session.country || req.session.lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getMovies( req.params.city.replace( unSlug, ' ' ), req.session.country || req.session.lang )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
};

module.exports.around = ( req, res ) => {
  var coords = req.headers[ 'x-movienow-coords' ] ? JSON.parse( req.headers[ 'x-movienow-coords' ] ) : null,
      location = req.headers[ 'x-movienow-location' ],
      theaters,
      geocode;

  if( location ){
    location = citySanitize( location );
  }

  theaters = api.getTheaterAround( coords ? coords.join() : location )
    .then( parseAround );

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
      geocoder.geocode( location, function ( err, data ) {
        var result = data.results[ 0 ].address_components;
        if( err ){
          reject( err );
          return;
        }

        resolve( parseGeo( result ) );
      });
    } );
  }

  Promise.all( [ theaters, geocode ] )
    .then( result => {
      var data = {
        movies: result[0].movies,
        theaters: result[0].theaters,
        geo: result[ 1 ]
      };

      req.session.country = result[ 1 ].country.short;

      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( data );
    } )
    .catch( e => send500( req, res, e ) );
};
