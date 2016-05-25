var movies = require( '../db/movies' ),
    config = require( '../config' ),
    cityMap = require( '../db/cityMap' ),
    request = require( 'request-promise' ),
    geocoder = require( 'geocoder' ),
    imdbId = require( '../helpers/imdb' );

var handleMovieDb = function( data ){

  if( data && data.poster ){
    return data;
  }

  return new Promise( ( resolve, reject ) => {

    function save ( info ){
      movies.update( data.id, info )
        .then( () => {
          resolve( info );
        } )
        .catch( reject );
    }

    if( data.imdb ){
      imdbId.poster( data.imdb )
        .then( poster => {
          save( {
            imdb: data.imdb.match( /\/(tt.*)\//)[1],
            poster: poster
          } );
        } )
        .catch( console.error );
    }
    else{
      imdbId.find( data.name )
        .then( imdb => {
          save( {
            imdb: imdb.id,
            poster: imdb.poster || 'none'
          } );
        } )
        .catch( () => {
          save( {
            poster: 'none'
          } );
        } );
    }
  } );

};

var handleCityDb = function( citySlug ){

  var geocode = new Promise( ( resolve, reject ) => {
    geocoder.geocode( citySlug.replace( '_', ', ' ), ( err, data ) => {
      console.log( data.results[0].geometry.location );
      if( err || !data.results.length ){
        //reject( err || data );
        resolve( {
          coord: {}
        } );
        return;
      }
      resolve( data.results[0].geometry.location );
    } );
  } );

  return geocode.then( coord => {
    console.log( `https://api.mapbox.com/styles/v1/enwin/cilc1wlfh0023bekqea6ijgm1/static/${coord.lng},${coord.lat},12,0,0/720x1280@2x?access_token=${config.mapToken}&attribution=false&logo=false` )
    // return a base64 of the image
    return request( {
      uri: `https://api.mapbox.com/styles/v1/enwin/cilc1wlfh0023bekqea6ijgm1/static/${coord.lng},${coord.lat},13,0,0/720x1280@2x?access_token=${config.mapToken}&attribution=false&logo=false`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      },
      encoding: 'binary',
      transform: ( body ) => {
        return  {
          slug: citySlug,
          map: new Buffer( body, 'binary' ).toString( 'base64' )
        };
      }
    } );
  } )
    // .then( cityMap.add );

}

module.exports.city = function( req, res ){
  cityMap.get( { slug: req.params.city } )
    .then( data => data || handleCityDb( req.params.city ) )
    .then( data => {
      var img = new Buffer( data.map, 'base64' );
      res.setHeader( 'Content-Type', 'image/jpeg');
      res.setHeader( 'Content-Length', img.length );
      res.end( img );
    } );
};

module.exports.poster = function( req, res ){
  movies.get( { id: req.params.id } )
    .then( handleMovieDb )
    .then( data => {
      if( data.poster !== 'none' ){
        var img = new Buffer( data.poster, 'base64' );
        res.setHeader( 'Content-Type', 'image/jpeg');
        res.setHeader( 'Content-Length', img.length );
        res.end( img );
      }
      else{
        res.redirect( '/media/posters/default.png' );
      }
    } );
};
