var request = require( 'request-promise' ),
    cheerio = require( 'cheerio' );

function parseId( link ){
  return link.split( '/' )[ 2 ];
}

function fetch( movieName ){
  return new Promise( ( reject, resolve ) => {
    var options = {
      uri: 'http://www.imdb.com/find',
      qs: {
        q: movieName,
        s: 'tt',
        exact: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      },
      transform: function (body) {
        return cheerio.load(body);
      }
    };

    request( options )
      .then( $ => { resolve( parseId( $('.findList .result_text a').attr( 'href' ) ) ); } )
      .catch( reject );
  } );

}

module.exports = fetch;
