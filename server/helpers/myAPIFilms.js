const config = require( '../config' ),
      request = require( 'request-promise-native' );

module.exports.movie = function( imdbId, language = 'en' ){
  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0'
    },
    json: true,
    uri: 'http://www.myapifilms.com/tmdb/movieInfoImdb',
    qs: {
      alternativeTitles: 0,
      casts: 0,
      format: 'json',
      genres: 0,
      idIMDB: imdbId,
      images: 0,
      keywords: 0,
      language: language,
      lists: 0,
      releases: 0,
      reviews: 0,
      similar: 0,
      token: config.myapifilmsToken,
      translations: 0,
      videos: 1
    }
  };

  return request( params )
    // return empty if call fails
    .catch( err => {
      console.error( 'myapifilms', err );
      return {};
    } );
};
