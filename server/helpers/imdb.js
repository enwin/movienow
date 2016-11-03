var request = require( 'request-promise-native' );

var posterSize = '._V1_SX200.jpg';

function parsePoster( src ){
  // find the last @ sign to remove all characters from this character
  var index = src.lastIndexOf( '._V1_' );

  if( index < 0 ){
    src = null;
  }
  else{
    // add the size we want
    src = src.substr( 0, index ) + posterSize;
  }

  // return a base64 of the image
  return request( {
    uri: src,
    headers: {
      'Referer': 'http://www.imdb.com/?ref_=nv_home',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    },
    encoding: 'binary',
    transform: ( body ) => {
      return new Buffer( body, 'binary' ).toString( 'base64' );
    }
  } );
}

var poster = function( posterSrc ){
  return parsePoster( posterSrc );
};

module.exports.poster = poster;
