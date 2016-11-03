'use-strict'

import favList from '../data/favorites';

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/theater.jade';
import _sort from 'lodash/sortBy';
import bind from '../helper/bind';
import Tablist from '../helper/accedeweb-tablist';

import user from '../data/user';

class Theater extends Screen {

  bind (){

    bind( this.el, 'click', '.button-favorite', e => this.handleFavorite( e ) );

    bind( this.el, 'load', 'img', this.handlePoster.bind( this ), true );
  }

  dom() {
    return {
      tagName: 'section',
      id: 'theater',
      className: 'screen screen-theater'
    };
  }

  displayed (){
    var faved = favList.find( this.data.screenParams.id ),
        refresh;

    if( faved !== this.data.favorite ){
      this.data.favorite = faved;
      this.els.favorites.classList.toggle( 'favorited', !!faved );

      if( !faved ){
        delete this.data.favorite;
      }
    }

    if( this.data.location !== user.location ){
      this.data.location = user.location;
      refresh = true;
    }
    else if( this.newDay() ){
      refresh = true;
    }

    if( refresh ){
      this.getData();
    }
    else if( this.data.movies ){
      this.orderMovies();
      this.render();
    }
  }

  getData (){
    var zip = this.data.location.zip.slug;

    if( undefined === this.data.favorite ){
      this.data.favorite = favList.find( this.data.screenParams.id );
    }

    if( this.data.favorite && this.data.favorite.country ){
      zip = this.data.favorite.country;
    }

    if( this.els && this.els.content ){
      this.els.content.innerHTML = '';
    }

    this.sync( [ '/api/theaters', this.data.location.country.short, zip, this.data.screenParams.id ].join('/') )
      .then( data => {
        if( !data ){
          return;
        }
        this.orderMovies();
        this.ready();
      } );
  }

  handleFavorite (){
    var fav = !!this.data.favorite;

    if( !fav ){
      this.data.favorite = {
        id: this.data.screenParams.id,
        name: this.data.name,
        zip: this.data.location.zip.slug
      };
    }

    favList[ fav ? 'remove' : 'add' ]( this.data.favorite );

    if( fav ){
      delete this.data.favorite;
    }

    this.els.favorites.classList.toggle( 'favorited', !fav );
  }

  handlePoster ( e ){
    e.currentTarget.classList.add( 'show' );
  }

  initialize (){
    this.data.location = user.location;

    this.getData();

    this.render();

    this.bind();
  }

  orderMovies (){
    var now = moment(),
        showtime,
        nextShowTime,
        nextShowTimeIndex,
        disabled,
        timeFormat = 'HH:mm';

    this.data.movies.forEach( movie => {

      movie.infos = {};
      nextShowTime = null;
      nextShowTimeIndex = null;

      movie.showtimes.forEach( ( types, showIndex ) => {
        types.times.forEach( ( time, index ) => {

          showtime = moment( time.value, 'YYYY-MM-DDTHH:mm' );

          disabled = now.isAfter( showtime );

          // if there's no next showtime found and current showtime is not already passed
          // also check when there's a next showtime if the next show index contains a showtime before the next showtime
          if( ( !nextShowTime && !disabled ) || ( nextShowTime && showIndex > nextShowTimeIndex && !disabled && nextShowTime.isAfter( showtime ) ) ){
            nextShowTime = showtime;
            nextShowTimeIndex = showIndex;
            movie.infos.nextShowTime = {
              formated: now.to( showtime ),
              value: showtime.diff( now )
            };
          }

          time.disabled = disabled;
          time.formated = showtime.format( timeFormat );
        } );
      } );
    } );

    this.data.movies = _sort( this.data.movies, movie => {
      return movie.infos.nextShowTime ? movie.infos.nextShowTime.value : Infinity;
    } );
  }

  ready (){
    this.setTitle( this.data.name );
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      content: this.el.querySelector( '.screen-content' ),
      favorites: this.el.querySelector( '.screen-header .theater-favorite' ),
      header: this.el.querySelector( '.screen-header' )
    };

    if( this.data.movies ){
      this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ), {
        openTab: this.scrollTop
      } );
    }
  }

  renderError (){

    this.els.content.innerHTML = this.errorDom( {
      title: '“Toto, I’ve got a feeling we’re not in Kansas anymore”',
      link: {
        text: 'Try again',
        type: 'refresh'
      },
      icon: 'search',
      type: 'error-reversed'
    } );
  }

  scrollTop (){
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }
}



export default ( args ) => {
  return new Theater( args );
};
