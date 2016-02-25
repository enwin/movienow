var api = require( './showtimes' );

// function getAllDays( tid ){
//   return new Promise( function( resolve, reject ){
//     [ api, apiDate1, apiDate2 ].forEach( call => call.getTheater( tid ) )
//   } );
// }

function getArtwork( response ) {

  return new Promise( function( resolve, reject ){

    if( response.forEach ){
      var moviesLength = response.length - 1;
      response.forEach( ( movie, index ) => {
        //setTimeout( () => {
          artwork( movie.name, ( err, url ) => {
            if( err ){
              reject( err );
            }
            response[ index ].artwork = url;

            if( index === moviesLength ){
              resolve( response );
            }
          } );
        //}, 1000 *index );
      } );
    }
    else{
      artwork( response.name, ( err, url ) => {
        if( err ){
          reject( err );
        }
        response.artwork = url;
        resolve( response );
      } );

    }
  } );
}

function send500( e ){
  this.status( 500 ).send( { error:e } ) };

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