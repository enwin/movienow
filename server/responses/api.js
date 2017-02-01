const api = require( '../helpers/imdb' ),
      movieDB = require( '../db/movies' ),
      myAPIFilms = require( '../helpers/myAPIFilms' ),
      geocoder = require( 'geocoder' ),
      slug = require( 'slug' ),
      slack = require( '../helpers/slack' ),
      citySanitize = require( '../helpers/city' ).sanitize,
      config = require( '../config' ),
      apiStore = {};

// constants for location around
const π = Math.PI,
      earthRadius = 6378137,
      locationOffsets = [
        [ -5000, 0 ],
        [ 0, 5000 ],
        [ 5000, 0 ],
        [ 0, -5000 ]
      ];

function getMoreData( movieId ){
  return myAPIFilms.movie( movieId );
}

function getLocationAround( location ){
  return locationOffsets.map( offset => {
    let dLat = offset[ 0 ] / earthRadius,
        dLng = offset[ 1 ] / ( earthRadius * Math.cos( π * location.lat / 180 ) );

    return {
      lat: location.lat + ( dLat * 180/π ),
      lng: location.lng + ( dLng * 180/π )
    };
  } ).concat( location );
}

function parseGeo( result ){
  const types = [ 'sublocality', 'locality', 'administrative_area_level_1', 'country', 'postal_code' ],
      name = [ 'closest', 'city', 'area', 'country', 'zip' ],
      geo = {};

  let match;

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

  if( !geo.zip ){
    return Promise.reject({
      code: 404,
      message: 'Could not find a match to your location',
      discard: 'Hasta la vista, baby'
    } );
  }

  return geo;
}

function saveMovies( movies, country ){
  return Promise.all( movies.map( movie => movieDB.store( movie, country ) ) )
    .catch( err => {
      console.error( 'saveMovies', err );
    } );
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

  const fields = [ {
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
    for( let key in e ){
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

  for( let key in cache.headers ){
    res.setHeader( key, cache.headers[ key ] );
  }

  res.send( cache.data );
}

module.exports.cache = ( req, res, next ) => {

  const url = req.originalUrl.replace( '?', '/' );

  if( apiStore[ url ] ){
    if( req.headers[ 'if-modified-since' ] ){
      res.status( 304 ).end();
    }
    else{
      send( res, apiStore[ url ] );
    }
    return;
  }

  res.cacheSend = data => {
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

module.exports.theaters = ( req, res ) => {
  if( req.params.id ){
    api.getTheater( req.params.id, req.params.country, req.params.zip, req.query.day )
      .then( data => {

        if( !data.id ){
          return Promise.reject( `No theater found with id ${req.params.id}` );
        }

          // return data;
        return saveMovies( data.movies, req.params.country )
          .then( () => data )
          .catch( console.error );
      } )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    var getLocation = new Promise( ( resolve, reject ) => {
      // get lat and lng based on the zip and country
      geocoder.geocode( `${req.params.zip}, ${req.params.country}`, ( err, data ) => {
        if( err ){
          reject( err );
          return;
        }

        // get north, east, south, west lat and lng 5km from the found location
        resolve( getLocationAround( data.results[ 0 ].geometry.location ) );
      } );
    } );


    getLocation
      .then( geometry => {
        // get theaters on all 5 location points
        return Promise.all( geometry.map( location => {
          return api.getTheaters( [ location.lat, location.lng ], req.query.day );
        } ) );
      } )
      .then( theaters => {

        // concat theaters
        theaters = theaters.reduce( ( a, b ) => a.concat( b ) );

        // dedupe theaters
        return theaters.filter( ( theater, index ) => {
          return index === theaters.findIndex( look => look.id === theater.id );
        } );

      } )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
};

module.exports.movies = ( req, res ) => {
  if( req.params.id ){

    if( 'undefined' === req.params.id ){
      return send500( req, res, 'Movie id is undefined' );
    }

    const movieId = req.params.id.replace( 'tt', req.params.country );
    // get movie from db
    movieDB.get( {id: movieId } )
      .then( dbMovie => {
        // get showtimes and movie if not in db
        return api.getMovie( req.params.id, req.params.country, req.params.zip, req.query.day )
          .then( imdbMovie => {

            if( !imdbMovie && !dbMovie ){
              return Promise.reject( `No movie found with id ${req.params.id}` );
            }

            // replace dbMovie with imdbMovie if not in db
            if( !dbMovie ){
              dbMovie = imdbMovie;
              dbMovie.imdbId = dbMovie.id;
            }
            else{
              // update title and showtimes
              Object.assign( dbMovie, {
                director: imdbMovie.director,
                genre: imdbMovie.genre,
                theaters: imdbMovie.theaters
              } );
            }

            return dbMovie;
          } )
          .catch( console.error );
      } )
      .then( movie => {
        if( !movie.trailer ){
          return getMoreData( req.params.id, req.params.country )
            .then( moreData => {
              if( moreData && moreData.data ){
                let trailer = moreData.data.videos.find( video => video.type === 'Trailer' );

                if( trailer ){
                  movie.trailer = trailer.key;
                }
              }

              return movie;
            } )
            .catch( console.error );
        }

        return movie;
      } )
      .then( movie => {
        return saveMovies( [ movie ], req.params.country )
          .then( () => movie );
      } )
      .then( movie => res.cacheSend( movie ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getMovies( req.params.country, req.params.zip, req.query.day )
      .then( data => {
        return saveMovies( data, req.params.country )
          .then( () => data );
      } )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
};

module.exports.around = ( req, res ) => {
  const coords = req.headers[ 'x-movienow-coords' ] ? JSON.parse( req.headers[ 'x-movienow-coords' ] ) : null,
      aroundData = {};

  let location = req.headers[ 'x-movienow-location' ];

  let geocode;

  if( location ){
    location = citySanitize( location );
  }

  if( coords ){
    geocode = new Promise( ( resolve, reject ) => {
      geocoder.reverseGeocode( coords[ 0 ], coords[ 1 ], ( err, data ) => {
        let result = data.results[ 0 ].address_components;
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
        if( err ){
          reject( err );
          return;
        }

        if( !data.results.length ){
          reject( {
            code: 404,
            message: 'Could not find a match to your location',
            discard: 'Hasta la vista, baby'
          } );
          return;
        }

        const location = data.results[ 0 ].geometry.location;

        geocoder.reverseGeocode( location.lat, location.lng, ( err, data ) => {
          if( err ){
            reject( err );
            return;
          }

          let result = data.results[ 0 ].address_components;

          resolve( parseGeo( result ) );
        } );
      });
    } );
  }

  geocode
    .then( geo => {
      aroundData.geo = geo;
      return api.aroundMe( coords ? coords : [ geo.country.short, geo.zip.short ], geo.country.short, req.query.day );
    } )
    .then( aroundLists => {
      Object.assign( aroundData, aroundLists );

      res.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate' );
      res.send( aroundData );
    } )
    .catch( e => {
      if( e.code ){
        return res.status( e.code ).send( {
          error: e
        } );
      }

      return send500( req, res, e );
    } );

};
