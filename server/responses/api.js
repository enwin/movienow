var api = require( './showtimes' ),
    geocoder = require( 'geocoder' ),
    _flatten = require( 'lodash/flatten' ),
    _uniqBy = require( 'lodash/uniqBy' ),
    _sortBy = require( 'lodash/sortBy' ),
    slug = require( 'slug' ),
    unSlug = /\s/gi,
    citySanitize = require( '../helpers/city' ).sanitize;

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

function send500( e ){
  this.status( 500 ).send( { error:e } );
}

module.exports.theaters = function( req, res ){
  if( req.params.id ){
    api.getTheaterPlannig( req.params.city.replace( unSlug, ' ' ), req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    //api.getTheaters( result );
    api.getTheaters( req.params.city.replace( unSlug, ' ' ) )
    .then( data => res.send( data ) )
    .catch( send500.bind( res ) );
  }
};


module.exports.movies = function( req, res ){

  if( req.params.id ){
    api.getMovie( req.params.city.replace( unSlug, ' ' ), req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    api.getMovies( req.params.city.replace( unSlug, ' ' ) )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
};

module.exports.around = ( req, res ) => {
  var coords = req.headers[ 'x-movienow-coords' ] ? JSON.parse( req.headers[ 'x-movienow-coords' ] ) : null,
      location = citySanitize( req.headers[ 'x-movienow-location' ] ),
      theaters,
      geocode;

  theaters = api.getTheaterAround( coords ? coords.join() : location )
    .then( parseAround );

  if( coords ){
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.reverseGeocode( coords[ 0 ], coords[ 1 ], ( err, data ) => {
        var geo = {},
            result = data.results[ 0 ].address_components;
        if( err ){
          reject( err );
          return;
        }

        [ 'number', 'route', 'city', 'level2', 'area', 'country' ].forEach( ( type, index ) => {

          if( index < 2 || index === 3 ){
            return;
          }

          geo[ type ] = {
            short: result[ index ].short_name,
            long: result[ index ].long_name,
            slug: slug( result[ index ].long_name.toLowerCase() )
          };
        } );

        resolve( geo );
      } );
    } );
  }
  else{
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.geocode( location, function ( err, data ) {
        var geo = {},
            result = data.results[ 0 ].address_components;
        if( err ){
          reject( err );
          return;
        }


        var match = [ 'locatlity', 'administrative_area_level_1', 'country' ],
            type = [ 'city', 'area', 'country' ],
            index = 0;
        result.forEach( component => {

          if( match.indexOf( component.types[ 0 ] ) < 0 ){
            return;
          }

          geo[ type[ index ] ] = {
            short: result[ index ].short_name,
            long: result[ index ].long_name,
            slug: slug( result[ index ].long_name.toLowerCase() )
          };

          index++;
        } );

        resolve( geo );
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
