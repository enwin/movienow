const request = require( 'request-promise-native' ),
      cheerio = require( 'cheerio' );

const reTheaterId = /cinema\/(\d+)/,
      reDirectors = /\s*\n/g,
      reExtraInfo = /\(([\w\s]+)?\s?(\d{4})\)/;

const reIID = /tt\w*/,
      reTitleYear = /(.+)\s\((\d+)\)/i,
      langs = {
        AR: 'es-AR',
        AU: 'en-EN',
        CA: 'en-EN',
        CL: 'es-CL',
        DE: 'de-DE',
        ES: 'es-ES',
        FR: 'fr-FR',
        IT: 'it-IT',
        MX: 'es-MX',
        NZ: 'en-EN',
        UK: 'en-GB',
        US: 'en-US'
      };


class Imdb{
  _callJSON ( options ){
    const params = Object.assign( options, {
      headers: {
        'Referer': 'http://m.imdb.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0',
        'X-Requested-With': 'XMLHttpRequest'
      },
      json: true
    } );
    return request( params );
  }

  _callPage ( options ){
    const params = {
      uri: options.uri,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0',
        'Accept-Language': `${langs[ options.country ]};q=0.8`
      },
      transform: body => {
        return cheerio.load( body );
      }
    };
    return request( params );
  }


  _parseShowtimes ( showtimes ){
    return showtimes.map( time => {
      let $time = cheerio( time ),
          showtime,
          amPm,
          meridian;

      showtime = $time.text().split( '|' ).map( time => {
        time = time.trim();

        meridian = time.split( ' ' )[1];

        if( !meridian ){
          time += ` ${amPm}`;
        }
        else{
          amPm = meridian;
        }

        return {
          original: time
        };
      } );

      return {
        times: showtime
      };
    } );
  }

  _parseMovies ( response ){
    let category;

    return response.result.map( entry => {
      if( entry.header ){
        category = entry.header;
        return;
      }

      let [ , type, year ] = entry.extra.match( reExtraInfo );

      let rating, runtime, score;

      if( entry.detail ){
        [ rating, runtime, score ] = entry.detail.split( ', ' );

        if( !isNaN( rating.slice( 0, 1 ) ) ){
          // rating is score
          if( rating.indexOf( '/' ) !== -1 ){
            rating = null;
          }
          // rating is runtime
          else{
            runtime = rating;
            rating = null;
          }
        }
        // runtime is score
        if( runtime && runtime.indexOf( '/' ) !== -1 ){
          runtime = null;
        }
      }

      return {
        id: entry.tconst,
        title: entry.title,
        extra: entry.extra,
        imgSrc: entry.img ? entry.img.url : null,
        category: category,
        type: type ? type.trim() : null,
        year: year,
        rating: rating,
        runtime: runtime
      };

    } ).filter( entry => entry );
  }

  _parseMoviePage ( $ ){

    let title = $( '#title-overview h1' ).text();

    let theaters = Array.from( $( '.list.detail > .list_item' ) ).map( el => {
      let $el = $( el );
      let [ name, streetAddress, city, zip ] = Array.from( $el.find( '[itemprop="name"], [itemprop="streetAddress"], [itemprop="addressLocality"], [itemprop="postalCode"]' ) ).map( key => $( key ).text() );

      let showtimes = Array.from( $el.find( '.showtimes' ) ).map( showtimes => {
        let $showtimes = $( showtimes );
        return {
          info: $showtimes.find( '.attributes' ).text(),
          times: Array.from( $showtimes.find( '[itemprop="startDate"]' ) ).map( date => $( date ).attr( 'content' ) )
        };
      } );

      return {
        id: $el.find( '[data-cinemaid]' ).attr( 'data-cinemaid' ),
        name: name,
        address: {
          street: streetAddress,
          city: city,
          zip: zip
        },
        showtimes: showtimes
      };

    } );


    return {
      title: title,
      theaters: theaters
    };
  }

  _parseMovie ( $ ){
    const $el = $( '.article.sub-overview' ),
          $link = $el.find( '[itemprop="name"] a' );

    // let info = $el.find( '.cert-runtime-genre' ).text().trim();

    let rating = $el.find( '.cert-runtime-genre img' ).attr( 'title' ) || $el.find( '.cert-runtime-genre [itemprop="contentRating"]' ).text().trim(),
        runtime = $el.find( '.cert-runtime-genre [itemprop="duration"]' ).text().trim(),
        genre = Array.from( $el.find( '.cert-runtime-genre [itemprop="genre"]' ) ).map( el => {
          let $el = $( el );
          return $el.text().trim();
        } ),
        cast = Array.from( $el.find( '[itemprop="actors"]' ) ).map( el => {
          let $el = $( el );
          return $el.text().trim();
        } );


    runtime = +runtime.replace( ' min', '' );

    let [ , name, year ] = reTitleYear.exec( $link.attr( 'title' ) );

    const movie = {
      id: $link.attr( 'href' ).match( reIID )[0],
      imgSrc: $el.find( '.poster' ).attr( 'src' ),
      title: name,
      rating: rating,
      runtime: runtime,
      cast: cast,
      description: $el.find( '[itemprop="description"]' ).text().trim(),
      genre: genre,
      director: $el.find( '[itemprop="director"]' ).text().trim().split( reDirectors ),
      year: year
    };

    movie.theaters = this._parseTheatersFromMoviePage( Array.from( $( '.list_item' ) ) );

    return movie;
  }


  _parseMovieList ( $ ){
    const movies = [];
    $( '.lister-item.mode-grid' ).each( ( index, el ) => {
      let $el = $( el ),
          $popout = $el.find( '.lister-item-content' ),
          img = $el.find( 'img.loadlate' ),
          id = img.attr( 'data-tconst' );

      if( !id ){
        return;
      }

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

  _parseMoviesFromTheaterPage ( $, $movies ){
    return $movies.map( el => {
      let $el = $( el ),
          $link = $el.find( '[itemprop="name"] a' ),
          asId = !!$link.attr( 'href' );

      if( !asId ){
        return;
      }

      let movie = {
        id: $link.attr( 'href' ).match( reIID )[0],
        title: $link.attr( 'title' ).replace( 'Showtimes for ', '' ),
        runtime: +$el.find( '[itemprop="duration"]' ).text().trim().replace( ' min', '' ),
        imgSrc: $el.find( '[itemprop="image"]' ).attr( 'src' ),
        showtimes: []
      };

      movie.showtimes = this._parseShowtimes( Array.from( $el.find( '.showtimes' ) ) );

      return movie;
    } ).filter( entry => entry );

  }

  _parseTheatersFromMoviePage ( $theaters ){
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

  _parseTheaters ( response ){
    return response.result.map( entry => {
      if( entry.header ){
        return;
      }

      return {
        id: 'ci'+entry.url.match( reTheaterId )[1],
        name: entry.name,
        address: entry.address,
      };
    } )
    .filter( entry => entry );
  }

  _parseTheater ( $ ){
    let $el = $( '.article.listo' ),
        $name = $el.find( '.fav_box' ),
        $address = $el.find( '.description' );

    let theater = {
      id: $name.find( '[data-cinemaid]' ).attr( 'data-cinemaid' ),
      name: $name.find( '[itemprop="name"]' ).text().trim(),
      address: `${$address.find( '[itemprop="streetAddress"]' ).text().trim()}, ${$address.find( '[itemprop="addressLocality"]' ).text().trim()} ${$address.find( '[itemprop="postalCode"]' ).text().trim()}`,
      phone: $address.find( '[itemprop="telephone"]' ).text().trim()
    };

    theater.movies = this._parseMoviesFromTheaterPage( $, Array.from( $el.find( '.list_item' ) ) );

    return theater;
  }

  getPoster ( src ){
    // find the last @ sign to remove all characters from this character
    const index = src.lastIndexOf( '._V1_' );

    if( index < 0 ){
      src = null;
    }
    else{
      // add the size we want
      src = src.substr( 0, index ) + '._V1_SX200.jpg';
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
        return new global.Buffer( body, 'binary' ).toString( 'base64' );
      }
    } );
  }

  getTheater ( id, countryCode, zip, date ){
    const uri = `http://www.imdb.com/showtimes/cinema/${countryCode}/${id}/${countryCode}/${zip}/${date}`;
    return this._callPage( {
      uri: uri,
      country: countryCode
    } )
    .then( this._parseTheater.bind( this ) )
    .catch( err => {
      console.error( 'getTheater', err );
    } );
  }

  getTheaters ( location, date, distance=60 ){
    const uri = `http://m.imdb.com/showtimes/cinema_list_json?location=${location.join()}&date=0:${date}&max_distance=${distance}`;
    return this._callJSON( {
      uri: uri
    } )
    .then( this._parseTheaters.bind( this ) )
    .catch( err => {
      console.error( 'getTheaters', err );
    } );
  }

  getMovie ( id, countryCode, zip, date ){
    return this._callPage( {
      uri: `http://www.imdb.com/showtimes/title/${id}/${countryCode}/${zip}/${date}`,
      country: countryCode
    } )
    .then( this._parseMovie.bind( this ) )
    .catch( err => {
      console.error( 'getMovie', err );
    } );
  }

  getMovies ( countryCode, zip, date ){
    return this._callPage( {
      uri: `http://www.imdb.com/showtimes/location/${countryCode}/${zip}/${date}?ref_=sh_dt`,
      country: countryCode
    } )
    .then( this._parseMovieList.bind( this ) )
    .catch( err => {
      console.error( 'getMovies', err );
    } );
  }

  aroundMe ( location, countryCode, date, distance=20 ){

    return Promise.all( [
      // get theaters around
      this.getTheaters( location, date, distance ),
      // get movies around
      this._callJSON( {
        uri:  `http://m.imdb.com/showtimes/movie_json?location=${location.join()}&date=0:${date}&max_distance=${distance}`,
        country: countryCode
      } )
    ] )
    .then( data => {
      const theaters = data[0];

      let currentMovieCat;

      const movies = data[1].result.map( movie => {
        if( movie.header ){
          currentMovieCat = movie.header;
          return false;
        }

        return {
          imdbId: movie.tconst,
          title: movie.title,
          category: currentMovieCat
        };
      } ).filter( entry => entry );

      return {
        theaters: theaters,
        movies: movies
      };
    } )
    .catch( err => {
      console.error( 'aroundMe', err );
    } );
  }
}

module.exports = new Imdb();
