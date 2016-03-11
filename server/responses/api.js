var api = require( './showtimes' ),
    geocoder = require( 'geocoder' ),
    _flatten = require( 'lodash/flatten' ),
    _uniqBy = require( 'lodash/uniqBy' ),
    _sortBy = require( 'lodash/sortBy' );

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
    api.getTheaterPlannig( req.params.city, req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    //api.getTheaters( result );
    api.getTheaters( req.params.city )
    .then( data => res.send( data ) )
    .catch( send500.bind( res ) );
  }
};


module.exports.movies = function( req, res ){

  if( req.params.id ){
    api.getMovie( req.params.city, req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    api.getMovies( req.params.city )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
};

module.exports.around = ( req, res ) => {
  var coords = req.headers[ 'x-movienow-coords' ] ? JSON.parse( req.headers[ 'x-movienow-coords' ] ) : null,
      location = req.headers[ 'x-movienow-location' ],
      theaters,
      geocode;

  theaters = api.getTheaterAround( coords ? coords.join() : location )
    .then( parseAround );

  if( coords ){
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.reverseGeocode( coords[ 0 ], coords[ 1 ], ( err, data ) => {
        if( err ){
          reject( err );
          return;
        }
        //console.log( data );
        resolve( data.results[ 0 ].address_components[ 3 ].long_name );
      } );
    } );
  }

  Promise.all( [ theaters, geocode ] )
    .then( datas => {
      var data = {
        movies: datas[0].movies,
        theaters: datas[0].theaters,
        city: datas[ 1 ] || location
      };

      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( data );
    } )
    .catch( send500.bind( res ) );
};
