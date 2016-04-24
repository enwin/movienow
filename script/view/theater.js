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

    bind( this.el, 'click', '[role=tab]', e => {
      this.tabs.tabAction( e );
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    } );
    bind( this.el, 'focus', '[role=tab]', e => {
      this.tabs.tabFocus( e );
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }, true );
    bind( this.el, 'keydown', '[role=tab]', this.tabs.tabKey );
    bind( this.el, 'focus', '[role=tabpanel]', this.tabs.panelFocus, true );
    bind( this.el, 'keydown', '[role=tabpanel]', this.tabs.panelKey );

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
    var favStatus = favList.is( this.data.screenParams.id ),
        refresh;

    if( favStatus !== this.data.favorited ){
      this.data.favorited = favStatus;
      this.els.favorites.classList.toggle( 'favorited', this.data.favorited );
    }

    if( this.data.location !== user.location ){
      this.data.location = user.location;
      refresh = true;
    }
    else if( this.newDay() ){
      refresh = true;
    }

    if( refresh ){
      this.els.list.innerHTML = '';
      this.getData();
    }
    else if( this.data.movies ){
      this.orderMovies();
      this.render();
    }
  }

  getData (){

    this.data.favorited = favList.is( this.data.screenParams.id );

    this.sync( [ '/api/theaters', this.data.location.city.slug, this.data.screenParams.id ].join('/') )
      .then( () => this.orderMovies() )
      .then( () => this.ready() )
      .catch( console.error );
  }

  handleFavorite (){
    this.data.favorited = !this.data.favorited;

    favList[ this.data.favorited ? 'add' : 'remove' ]( {
      id: this.data.screenParams.id,
      name: this.data.name
    } );

    this.els.favorites.classList.toggle( 'favorited', this.data.favorited );
  }

  handlePoster ( e ){
    e.currentTarget.classList.add( 'show' );
  }

  initialize (){
    this.data.location = user.location;

    this.getData();

    this.render();
  }

  orderMovies (){
    var now = moment(),
        showtime,
        disabled;

    this.data.movies.forEach( movie => {

      movie.infos = {};

      movie.showtimes.forEach( ( types, showIndex ) => {
        types.times.forEach( ( time, index ) => {

          showtime = moment( time.formated || time, 'HH:mm' );

          disabled = now.isAfter( showtime );

          if( !movie.infos.nextShowTime && !disabled ){
            movie.infos.nextShowTime = {
              formated: now.to( showtime ),
              value: showtime.diff( now )
            };
          }

          movie.showtimes[ showIndex ].times[ index ] = {
            disabled: disabled,
            formated: time.formated || time,
            value: showtime.format( 'YYYY-MM-DDTHH:mm' )
          };
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
      this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ) );
      this.bind();
    }
  }
}



export default ( args ) => {
  return new Theater( args );
};
