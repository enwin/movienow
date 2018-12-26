const api = require( '../helpers/imdb' ),
      movieDB = require( '../db/movies' ),
      myAPIFilms = require( '../helpers/myAPIFilms' ),
      nodeGeocoder = require('node-geocoder'),
      slug = require( 'slug' ),
      slack = require( '../helpers/slack' ),
      citySanitize = require( '../helpers/city' ).sanitize,
      config = require( '../config' ),
      apiStore = {};

const geocoder = nodeGeocoder({
  provider: 'openstreetmap',
  language: 'en',
  email: config.email
});

function getMoreData( movieId ){
  return myAPIFilms.movie( movieId );
}

function parseGeo( result ){
  const [data] = result;

  const geo = {
    city: {
      long: data.city,
      short: data.city,
      slug: slug( data.city.toLowerCase() )
    },
    country: {
      long: data.country,
      short: data.countryCode,
      slug: slug( data.country.toLowerCase() )
    },
    zip: {
      long: data.zipcode,
      short: data.zipcode
    }
  };

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
    const { zip, country } = req.params;
    return api.getTheaters( country, zip, req.query.day )
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
                theaters: imdbMovie.theaters,
                cast: imdbMovie.cast
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
    const [lat, lon] = coords;

    geocode = geocoder.reverse( {lat, lon} )
      .then( parseGeo );
  }
  else{
    geocode = geocoder.geocode( location )
      .then(parseGeo);
  }

  geocode
    .then( geo => {
      aroundData.geo = geo;
      return api.aroundMe( geo.zip.short, geo.country.short, req.query.day );
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
