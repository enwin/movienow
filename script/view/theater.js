'use-strict'

import favList from '../data/favorites';

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/theater.jade';
import _sort from 'lodash/sortBy';
import _extend from 'lodash/extend';
import bind from '../helper/bind';
import Tablist from '../helper/accedeweb-tablist';

class Theater extends Screen {

  bind (){

    bind( this.el, 'click', '[role=tab]', this.tabs.tabAction );
    bind( this.el, 'focus', '[role=tab]', this.tabs.tabFocus, true );
    bind( this.el, 'keydown', '[role=tab]', this.tabs.tabKey );
    bind( this.el, 'focus', '[role=tabpanel]', this.tabs.panelFocus, true );
    bind( this.el, 'keydown', '[role=tabpanel]', this.tabs.panelKey );

    bind( this.el, 'click', '.button-favorite', e => this.handleFavorite( e ) );
  }

  dom() {
    return {
      tagName: 'section',
      id: 'theater',
      className: 'screen screen-theater'
    };
  }

  displayed (){
    var favStatus = favList.is( this.datas.screenParams.id );

    if( favStatus !== this.datas.favorited ){
      this.datas.favorited = favStatus;
      this.els.favorites.classList.toggle( 'favorited', this.datas.favorited );
    }
  }

  handleFavorite (){
    this.datas.favorited = !this.datas.favorited;

    favList[ this.datas.favorited ? 'add' : 'remove' ]( {
      id: this.datas.screenParams.id,
      name: this.datas.name
    } );

    this.els.favorites.classList.toggle( 'favorited', this.datas.favorited );
  }

  initialize (){
    this.getData();

    this.render();
  }

  getData (){

    this.datas.favorited = favList.is( this.datas.screenParams.id );

    this.sync( '/api/theaters/'+this.datas.screenParams.id )
      .then( () => this.ready() )
      .catch( e => console.log( e ) );
  }

  getDays (){
    this.datas.nextDay = moment().add( 2, 'd' ).format( 'dddd' );
  }

  parse ( data ){

    var now = moment(),
        showtime,
        disabled;

    data.movies.forEach( ( movies, dayIndex ) => {
      movies.forEach( movie => {

        movie.infos = {};

        movie.showtimes.forEach( ( types, showIndex ) => {
          types.times.forEach( ( time, index ) => {

            showtime = moment( time, 'HH:mm' ).add( dayIndex, 'd' );

            disabled = now.isAfter( showtime );

            if( !dayIndex && !movie.infos.nextShowTime && !disabled ){
              movie.infos.nextShowTime = {
                formated: now.to( showtime ),
                value: showtime.diff( now )
              };
            }

            movie.showtimes[ showIndex ].times[ index ] = {
              disabled: disabled,
              formated: time,
              value: showtime.format( 'YYYY-MM-DDTHH:mm' )
            };
          } );
        } );
      } );
    } );

    data.movies[0] = _sort( data.movies[0], movie => {
      return movie.infos.nextShowTime ? movie.infos.nextShowTime.value : Infinity;
    } );

    return _extend( this.datas, data );

  }

  ready (){
    this.getDays();
    this.setTitle( this.datas.name );
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      favorites: this.el.querySelector( '.screen-header .theater-favorite' )
    };

    if( this.datas.movies ){
      this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ) );
      this.bind();
    }
  }
}



export default ( args ) => {
  return new Theater( args );
};
