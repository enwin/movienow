const api = require( '../helpers/imdb' ),
      movieDB = require( '../db/movies' ),
      geocoder = require( 'geocoder' ),
      slug = require( 'slug' ),
      slack = require( '../helpers/slack' ),
      citySanitize = require( '../helpers/city' ).sanitize,
      config = require( '../config' ),
      apiStore = {};

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
  Promise.all( movies.map( movie => movieDB.add( movie, country ) ) );
  return movies;
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
        saveMovies( data.movies, req.params.country );
        return data;
      } )
      .then( data => {
        data.movies = data.movies.map( movie => {
          movie.title = movie.title[ req.params.country ] || movie.title;
          return movie;
        } );

        return data;
      } )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getTheaters( [ req.params.country, req.params.zip ], req.query.day )
    .then( data => res.cacheSend( data ) )
    .catch( e => send500( req, res, e ) );
  }
};


module.exports.movies = ( req, res ) => {
  if( req.params.id ){
    api.getMovie( req.params.id, req.params.country, req.params.zip, req.query.day )
      .then( data => {
        saveMovies( [ data ], req.params.country );
        return data;
      } )
      .then( data => {
        data.title = data.title[ req.params.country ] || data.title;
        return data;
      } )
      .then( data => res.cacheSend( data ) )
      .catch( e => send500( req, res, e ) );
  }
  else{
    api.getMovies( req.params.country, req.params.zip, req.query.day )
      .then( data => {
        saveMovies( data, req.params.country );
        return data;
      } )
      .then( data => {
        return data.map( movie => {
          movie.title = movie.title[ req.params.country ] || movie.title;
          return movie;
        } );
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
