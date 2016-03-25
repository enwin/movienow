var api = require( './showtimes' ),
    geocoder = require( 'geocoder' ),
    _flatten = require( 'lodash/flatten' ),
    _uniqBy = require( 'lodash/uniqBy' ),
    _sortBy = require( 'lodash/sortBy' ),
    slug = require( 'slug' ),
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

  var match = [ 'locality', 'administrative_area_level_1', 'country' ],
      type = [ 'city', 'area', 'country' ],
      geo = {},
      index = 0;

  result.forEach( component => {

    if( match.indexOf( component.types[ 0 ] ) < 0 ){
      return;
    }

    geo[ type[ index ] ] = {
      short: component.short_name,
      long: component.long_name,
      slug: slug( component.long_name.toLowerCase() )
    };

    index++;
  } );

  return geo;
}

function send500( e ){
  this.status( 500 ).send( { error:e } );
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
    api.getTheater( req.params.city.replace( unSlug, ' ' ), req.params.id )
      .then( data => res.cacheSend( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    //api.getTheaters( result );
    api.getTheaters( req.params.city.replace( unSlug, ' ' ) )
    .then( data => res.cacheSend( data ) )
    .catch( send500.bind( res ) );
  }
};


module.exports.movies = function( req, res ){

  if( req.params.id ){
    api.getMovie( req.params.city.replace( unSlug, ' ' ), req.params.id )
      .then( data => res.cacheSend( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    api.getMovies( req.params.city.replace( unSlug, ' ' ) )
      .then( data => res.cacheSend( data ) )
      .catch( send500.bind( res ) );
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
    .then( datas => {
      var data = {
        movies: datas[0].movies,
        theaters: datas[0].theaters,
        geo: datas[ 1 ]
      };

      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( data );
    } )
    .catch( send500.bind( res ) );
};
