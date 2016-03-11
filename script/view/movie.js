'use-strict'

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/movie.jade';
import _sort from 'lodash/sortBy';
import _extend from 'lodash/extend';
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
    bind( this.el, 'keydown', '[role=tab]', e => this.tabs && this.tabs.tabKey( e ) );
    bind( this.el, 'focus', '[role=tabpanel]', e => this.tabs && this.tabs.panelFocus( e ), true );
    bind( this.el, 'keydown', '[role=tabpanel]', e => this.tabs && this.tabs.panelKey( e ) );

    bind( this.el, 'load', 'img', this.handlePoster.bind( this ), true );
  }

  displayed (){
    if( this.datas.location !== user.location ){
      this.datas.location = user.location;
      this.els.list.innerHTML = '';
      this.getData();
    }
  }

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-movie'
    };
  }

  handlePoster ( e ){
    e.currentTarget.classList.add( 'show' );
  }

  initialize (){
    this.datas.location = user.location;

    this.getData();

    this.render();

    this.bind();
  }

  getData (){
    this.sync( [ '/api/movies', this.datas.location.toLowerCase(), this.datas.screenParams.id ].join('/') )
      .catch( e => console.log( e ) )
      .then( () => this.ready() );
  }

  parse ( data ){

    var now = moment(),
        showtime,
        disabled;

    data.theaters.forEach( theater => {

      theater.infos = {};

      theater.showtimes.forEach( ( types, showIndex ) => {
        types.times.forEach( ( time, index ) => {

          showtime = moment( time, 'HH:mm' );

          disabled = now.isAfter( showtime );

          if( !theater.infos.nextShowTime && !disabled ){
            theater.infos.nextShowTime = {
              formated: now.to( showtime ),
              value: showtime.diff( now )
            };
          }

          theater.showtimes[ showIndex ].times[ index ] = {
            disabled: disabled,
            formated: time,
            value: showtime.format( 'YYYY-MM-DDTHH:mm' )
          };
        } );
      } );
    } );

    data.theaters = _sort( data.theaters, theater => {
      return theater.infos.nextShowTime ? theater.infos.nextShowTime.value : Infinity;
    } );

    return _extend( this.datas, data );

  }

  ready (){
    this.setTitle( this.datas.name );
    this.render();
    this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ) );
  }

  render (){
    this.el.innerHTML = view( this.datas );
  }
}

export default ( args ) => {
  return new Theater( args );
};
