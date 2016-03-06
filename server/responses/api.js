var api = require( './showtimes' ),
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


  // function result( error, response ){
  //   if( !error ){
  //     res.send( response );
  //   }
  //   else{
  //     send500( error );
  //   }
  // }

  if( req.params.id ){
    // getAllDays( req.params.id )
    //   .then( result )
    //   .catch( send500 );
    // api.getTheater( req.params.id )
    //   .then( data => res.send( data ) )
    //   .catch( send500.bind( res ) );

    api.getTheaterPlannig( req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    //api.getTheaters( result );
    api.getTheaters()
    .then( data => res.send( data ) )
    .catch( send500.bind( res ) );
  }
};


module.exports.movies = function( req, res ){

  if( req.params.id ){
    api.getMovie( req.params.id )
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
  else{
    api.getMovies()
      .then( data => res.send( data ) )
      .catch( send500.bind( res ) );
  }
};

module.exports.around = ( req, res ) => {
  api.getTheaterAround( JSON.parse( req.headers[ 'x-movienow-location' ] ) )
    .then( parseAround )
    .then( data => {
      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( data );
    } )
    .catch( send500.bind( res ) );
};
