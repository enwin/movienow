'use strict';

const request = require( 'request-promise-native' ),
      cheerio = require( 'cheerio' ),
      moment = require( 'moment' );

const reIID = /tt\w*/,
      reTitleYear = /([\w\s]+)\s\((\d+)\)/i,
      langs = {
        AR: 'es-AR,es',
        AU: 'en-AU,en',
        CA: 'en-CA,en',
        CL: 'es-CL,es',
        DE: 'de',
        ES: 'es',
        FR: 'fr',
        IT: 'it',
        MX: 'es-MX,es',
        NZ: 'en-NZ,en',
        UK: 'en-GB,en',
        US: 'en-US,en'
      };

class Imdb {

  _call ( options ){
    console.log( options.uri, `${langs[ options.lang ]};q=0.8` );
    return request( {
      uri: options.uri,
      qs: options.qs,
      headers: {
        'Referer': 'http://www.imdb.com/?ref_=nv_home',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        'Accept-Language': `${langs[ options.lang ]};q=0.8`,
        'DNT': 1
      },
      transform: ( body ) => {
        return cheerio.load( body );
      }
    } );
  }

  _parseMovie ( $ ){
    const $el = $( '.article.sub-overview' ),
          $link = $el.find( '[itemprop="name"] a' );

    let info = $el.find( '.cert-runtime-genre' ).text().trim();

    let [ rating, runtime, ...genre ] = info.replace(/[\|\-]/g,'').split( /\n\s+/ );

    // in case there's no rating, move data
    if( isNaN( runtime.slice( 0, 1 ) ) ){
      genre.splice( 0, 0, runtime );
      runtime = rating;
      rating = null;//$el.find( '.cert-runtime-genre img' ).attr( 'title' );
    }

    runtime = +runtime.replace( ' min', '' );


    let [ , name, year ] = reTitleYear.exec( $link.attr( 'title' ) );

    const movie = {
      id: $link.attr( 'href' ).match( reIID )[0],
      imgSrc: $el.find( '.poster' ).attr( 'src' ),
      title: name,
      rating: rating,
      runtime: runtime,
      description: $el.find( '[itemprop="description"]' ).text().trim(),
      genre: genre,
      director: $el.find( '[itemprop="director"]' ).text().trim(),
      year: year
    };

    movie.theaters = this._parseTheaters( Array.from( $( '.list_item' ) ) );

    return movie;
  }

  _parseMovies ( $, $movies ){
    // const now = moment();

    return $movies.map( el => {
      let $el = $( el ),
          $link = $el.find( '[itemprop="name"] a' ),
          asId = !!$link.attr( 'href' );

      let movie = {
        id: asId ? $link.attr( 'href' ).match( reIID )[0] : null,
        title: asId ? $link.attr( 'title' ).replace( 'Showtimes for ', '' ) : $el.find( '.info h4' ).text().trim(),
        runtime: +$el.find( '[itemprop="duration"]' ).text().trim().replace( ' min', '' ),
        showtimes: []
      };

      movie.showtimes = this._parseShowtimes( Array.from( $el.find( '.showtimes' ) ) );

      return movie;
    } );

  }

  _parseMovieList ( $ ){
    const movies = [];
    $( '.lister-item.mode-grid' ).each( ( index, el ) => {
      let $el = $( el ),
          $popout = $el.find( '.lister-item-content' ),
          img = $el.find( 'img.loadlate' );

      let movie = {
        id: img.attr( 'data-tconst' ),
        imgSrc: img.attr( 'loadlate' ),
        title: $popout.find( '.lister-item-header a' ).text().trim(),
        runtime: +$popout.find( '.runtime' ).text().trim().replace( ' min', '' ),
        genre: $popout.find( '.genre' ).text().trim().split( ', ' ),
        description: $popout.find( '.ratings-bar + p' ).text().trim()
      };

      movies.push( movie );
    } );

    return movies;
  }

  _parseShowtimes ( showtimes ){
    return showtimes.map( time => {
      let $time = cheerio( time ),
          showtime,
          amPm,
          meridian,
          currentTime;

      showtime = $time.text().split( '|' ).map( time => {
        time = time.trim();

        meridian = time.split( ' ' )[1];

        if( !meridian ){
          time += ` ${amPm}`;
        }
        else{
          amPm = meridian;
        }

        currentTime = moment( time, 'HH:mm A' );

        return {
          original: time,
          value: currentTime.format( 'YYYY-MM-DDTHH:mm' )
        };
      } );

      return {
        times: showtime
      };
    } );
  }

  _parseTheaters ( $theaters ){
    return $theaters.map( el => {
      let $el = cheerio( el ),
          $name = $el.find( '.fav_box' ),
          $address = $el.find( '.address' );

      let theater = {
        id: $name.find( '[data-cinemaid]' ).attr( 'data-cinemaid' ),
        name: $name.find( '[itemprop="url"]' ).text().trim(),
        address: {
          street: $address.find( '[itemprop="streetAddress"]' ).text().trim(),
          city: $address.find( '[itemprop="addressLocality"]' ).text().trim(),
          zip: $address.find( '[itemprop="postalCode"]' ).text().trim()
        },
        phone: $address.find( '[itemprop="telephone"]' ).text().trim()
      };

      theater.showtimes = this._parseShowtimes( Array.from( $el.find( '.showtimes' ) ) );

      return theater;
    } );
  }

  _parseTheaterList ( $ ){
    return Array.from( $( '.list.detail > .list_item' ) ).map( el => {
      let $el = $( el ),
          $name = $el.find( '.fav_box' ),
          $address = $el.find( '.address' );

      let theater = {
        id: $name.find( '[data-cinemaid]' ).attr( 'data-cinemaid' ),
        name: $name.find( '[itemprop="url"]' ).text().trim(),
        address: {
          street: $address.find( '[itemprop="streetAddress"]' ).text().trim(),
          city: $address.find( '[itemprop="addressLocality"]' ).text().trim(),
          zip: $address.find( '[itemprop="postalCode"]' ).text().trim()
        },
        phone: $address.find( '[itemprop="telephone"]' ).text().trim()
      };

      theater.movies = this._parseMovies( $, Array.from( $el.find( '.list_item' ) ) );

      return theater;
    } );
  }

  getMovie ( id, zipcode, lang, options ){
    const params = {
      uri: `http://www.imdb.com/showtimes/title/${id}/${lang}/${zipcode}?ref_=sh_ov_tt`,
      lang: lang
    };

    return this._call( params )
      .then( this._parseMovie.bind( this ) );
      // .then( data => {
      //   let theaters = data.theaters;
      //   delete data.theaters;
      //   console.log( data );
      //   console.log( JSON.stringify( theaters[0], null, 2 ) );
      // } );
  }

  getMovies ( zipcode, lang, options ){
    const params = {
      uri: `http://www.imdb.com/showtimes/location/${lang}/${zipcode}?ref_=shlc_dt`,
      lang: lang
    };

    return this._call( params )
      .then( this._parseMovieList );
      // .then( data => {
      //   console.log( data.length, data[0], data[1] );
      // } );
  }

  getOpening ( lang, options ) {
    const params = {
      uri: `http://www.imdb.com/movies-in-theaters/?ref_=shlc_inth`,
      lang: lang
    };

    return this._call( params )
      .then( $ => {
        const movies = [];
        $( '.list_item' ).each( ( index, el ) => {
          let $el = $( el );

          movies.push( {
            id: $el.find( '.wlb_watchlist_lite' ).attr( 'data-tconst' ),
            imgSrc: $el.find( '.poster' ).attr( 'src' ),
            title: $el.find( 'h4[itemprop="name"] a' ).text().trim(),
            description: $el.find( '.outline' ).text().trim(),
            genre: $el.find( 'span[itemprop="genre"]' ).text().trim().split( ', ' )
          } );

        } );

        return movies;
      } );
  }

  getTheaters ( zipcode, lang, options ){
    const params = {
      uri: `http://www.imdb.com/showtimes/${lang}/${zipcode}`,
      lang: lang
    };

    return this._call( params )
      .then( this._parseTheaterList.bind( this ) );
      // .then( data => {
      //   console.log( data.length );
      //   console.log( JSON.stringify( data[0], null, 2 ) );
      // } );
  }
}


// let api = new Imdb();

module.exports = new Imdb();

// api.getMovies( 75001, 'fr', {} );
// api.getMovie( 'tt1211837', 75018, 'fr', {} );
// api.getTheaters( 75001, 'fr', {} );
// api.getOpening( 'fr', {} );
