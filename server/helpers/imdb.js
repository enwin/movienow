var request = require( 'request-promise' ),
    cheerio = require( 'cheerio' );

var currentYear = new Date().getFullYear(),
    filterYear = new RegExp( [ currentYear, currentYear-1 ].join('|') ),
    posterSize = '@._V1_SX200.jpg';

function parsePoster( src ){
  // find the last @ sign to remove all characters from this character
  var index = src.lastIndexOf( '@' );

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

function parseResult( $ ){
  var $results = $( '.findList .findResult' ),
      $el,
      data,
      link,
      poster;

  // if theres more than one result loop on it and try to match the more recent on ( current year or previous year )
  if( $results.length !== 1 ){
    $results.each( ( index, el ) => {
      $el = $( el );

      if( !$el.text().match( filterYear ) || data ){
        return;
      }

      link = $el.find( 'a' ).attr( 'href' );
      poster = $el.find( 'img' ).attr( 'src' );

      data = {
        id: link.split( '/' )[ 2 ]
      };

    } );
  }
  else{
    link = $results.find( 'a' ).attr( 'href' );
    poster = $results.find( 'img' ).attr( 'src' );

    data = {
      id: link.split( '/' )[ 2 ]
    };
  }
  // return a promise that will fetch the poster and store it
  return new Promise( ( resolve, reject ) => {
    // don't send the poster if its the nopicture poster
    if( poster.indexOf( 'nopicture' ) > -1 ){
      resolve( data );
      return;
    }

    parsePoster( poster )
      .then( poster => {
        // send back the poster along with the imdb id
        if( poster ){
          data.poster = poster;
        }
        resolve( data );
      } )
      .catch( reject );
  } );
}

function fetch( movieName ){
  return new Promise( ( resolve, reject ) => {
    var options = {
      uri: 'http://www.imdb.com/find',
      qs: {
        q: movieName,
        s: 'tt'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      },
      transform: body => {
        return cheerio.load(body);
      }
    };

    request( options )
      .then( $ => resolve( parseResult( $ ) ) )
      .catch( reject );
  } );

}

module.exports = fetch;
