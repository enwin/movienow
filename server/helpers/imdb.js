var request = require( 'request-promise' ),
    cheerio = require( 'cheerio' );

var remove = /\!|\?|\(.*\)|(,\s\(?(2D|3D)\)?)|\(?(2D|3D)\)?/gi,
    the = /(.*), (the)/,
    toSpace = /((\s(and|et|&)|\s?:)\s)/gi,
    splitSpaces = /\s{2,}/,
    isTv = /\((TV|Short|Video)/,
    movieYear = /\((\d*)\)/,
    posterSize = '._V1_SX200.jpg';

function sanitize( text ){
  return text ? text.toLowerCase().replace( the, '$2 $1' ).replace( remove, '' ).replace( toSpace, ' ' ).trim().split( splitSpaces )[0] : text;
}

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

function parseResult( $, name ){
  var $results = $( '.findList .findResult' ),
      $el,
      title,
      titleText,
      aka,
      foundAka,
      foundTitle,
      data,
      link,
      moviePoster;
  // if theres more than one result loop on it and try to match the title or the aka
  // if no poster is found it will fallback to the first movie on the list
  if( $results.length !== 1 ){
    // search in titles
    $results.each( ( index, el ) => {

      if( foundTitle ){
        return;
      }

      $el = $( el );
      title = $el.find( 'a' ).text();
      titleText = $el.text();

      if( isTv.test( titleText ) ){
        return;
      }


      if( ( title && sanitize( title ) === name ) ){
        link = $el.find( 'a' ).attr( 'href' );
        moviePoster = $el.find( 'img' ).attr( 'src' );

        foundTitle = {
          id: link.split( '/' )[ 2 ],
          title: title,
          poster: moviePoster,
          year: +titleText.match( movieYear )[1]
        };
      }


    } );

    // search in akas
    $results.each( ( index, el ) => {

      if( foundAka ){
        return;
      }

      $el = $( el );
      title = $el.find( 'a' ).text();
      titleText = $el.text();
      aka = $el.find( 'i' ).text();

      if( aka ){
        aka = sanitize( aka.slice( 1, -1 ) );
      }

      if( aka && aka === name ){
        link = $el.find( 'a' ).attr( 'href' );
        moviePoster = $el.find( 'img' ).attr( 'src' );

        foundAka = {
          id: link.split( '/' )[ 2 ],
          title: title,
          poster: moviePoster,
          year: +titleText.match( movieYear )[1]
        };
      }


    } );

    if( foundTitle && foundAka ){
      data = foundTitle.year > foundAka.year ? foundTitle : foundAka;
    }
    else if( foundTitle ){
      data = foundTitle;
    }
    else if( foundAka ){
      data = foundAka;
    }

    // fallback to the first item if its title contains the searched title
    if( !data ){
      $results = $( '.findList .findResult:first-child' );
      title = $results.find( 'a' ).text();
      link = $results.find( 'a' ).attr( 'href' );

      data = {
        id: link.split( '/' )[ 2 ],
        poster: $results.find( 'img' ).attr( 'src' ),
        title: title
      };
    }
  }
  else {
    title = $results.find( 'a' ).text();
    link = $results.find( 'a' ).attr( 'href' );
    moviePoster = $results.find( 'img' ).attr( 'src' );

    data = {
      id: link.split( '/' )[ 2 ],
      poster: moviePoster,
      title: title
    };
  }

  // return a promise that will fetch the poster and store it
  return new Promise( ( resolve, reject ) => {
    if( !data.poster ){
      reject( new Error( `No poster found for ${name}` ) );
    }
    // don't send the poster if its the nopicture poster
    if( data.poster.indexOf( 'nopicture' ) > -1 ){
      delete data.poster;
      resolve( data );
      return;
    }

    parsePoster( data.poster )
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

  movieName = sanitize( movieName );

  return new Promise( ( resolve, reject ) => {
    var options = {
      uri: 'http://www.imdb.com/find',
      qs: {
        q: movieName,
        s: 'tt'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.8',
        'DNT': 1
      },
      transform: ( body ) => {
        return cheerio.load(body);
      }
    };

    request( options )
      .then( $ => resolve( parseResult( $, movieName ) ) )
      .catch( reject );
  } );

}

module.exports.find = fetch;

var poster = function( id ){

  return new Promise( ( resolve, reject ) => {
    var options = {
      uri: id,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.8',
        'DNT': 1
      },
      transform: ( body ) => {
        return cheerio.load(body)( '.title-overview .poster img' ).attr( 'src' );
      }
    };

    request( options )
      .then( $ => parsePoster( $ ) )
      .then( resolve )
      .catch( reject );
  } );
};

module.exports.poster = poster;
