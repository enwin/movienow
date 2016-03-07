var request = require( 'request-promise' ),
    cheerio = require( 'cheerio' );

var currentYear = new Date().getFullYear(),
    filterYear = new RegExp( [ currentYear, currentYear-1 ].join('|') ),
    posterSize = '@._V1_SX200.jpg';

function parsePoster( src ){
  var index = src.lastIndexOf( '@' );

  if( index < 0 ){
    src = null;
  }
  else{
    src = src.substr( 0, index ) + posterSize;
  }

  return src;
}

function parseResult( $ ){
  var $results = $( '.findList .findResult' ),
      $el,
      data,
      link,
      poster;

  if( $results.length === 1 ){

    link = $results.find( 'a' ).attr( 'href' );
    poster = $results.find( 'img' ).attr( 'src' );

    data = {
      id: link.split( '/' )[ 2 ],
      poster: parsePoster( poster )
    };
  }

  $results.each( ( index, el ) => {
    $el = $( el );

    if( !$el.text().match( filterYear ) || data ){
      return;
    }

    link = $el.find( 'a' ).attr( 'href' );
    poster = $el.find( 'img' ).attr( 'src' );

    data = {
      id: link.split( '/' )[ 2 ],
      poster: parsePoster( poster )
    };

  } );

  return data || {};
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
      transform: function (body) {
        return cheerio.load(body);
      }
    };

    request( options )
      .then( $ => resolve( parseResult( $ ) ) )
      .catch( reject );
  } );

}

module.exports = fetch;
