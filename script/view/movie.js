'use-strict'

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/movie.jade';
import _sort from 'lodash/sortBy';
import bind from '../helper/bind';

import Tablist from '../helper/accedeweb-tablist';

import user from '../data/user';

class Theater extends Screen {

  bind (){
    bind( this.el, 'load', 'img', this.handlePoster.bind( this ), true );
  }

  displayed (){
    var refresh;

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
    else if( this.data.theaters ){
      this.orderTheaters();
      this.render();
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
    this.data.location = user.location;

    this.getData();

    this.render();

    this.bind();
  }

  getData (){
    this.sync( [ '/api/movies', this.data.location.city.slug, this.data.screenParams.id ].join('/') )
      .then( data => {
        if( !data ){
          return;
        }
        this.orderTheaters();
        this.ready();
      } );
  }

  orderTheaters (){

    var now = moment(),
        showtime,
        nextShowTime,
        nextShowTimeIndex,
        disabled;

    this.data.theaters.forEach( theater => {

      theater.infos = {};
      nextShowTime = null;
      nextShowTimeIndex = null;

      theater.showtimes.forEach( ( types, showIndex ) => {
        types.times.forEach( ( time, index ) => {

          showtime = moment( time.formated || time, 'HH:mm' );

          disabled = now.isAfter( showtime );

          // if there's no next showtime found and current showtime is not already passed
          // also check when there's a next showtime if the next show index contains a showtime before the next showtime
          if( ( !nextShowTime && !disabled ) || ( nextShowTime && showIndex > nextShowTimeIndex && !disabled && nextShowTime.isAfter( showtime ) ) ){
            nextShowTime = showtime;
            nextShowTimeIndex = showIndex;
            theater.infos.nextShowTime = {
              formated: now.to( showtime ),
              value: showtime.diff( now )
            };
          }

          theater.showtimes[ showIndex ].times[ index ] = {
            disabled: disabled,
            formated: time.formated || time,
            value: showtime.format( 'YYYY-MM-DDTHH:mm' )
          };
        } );
      } );
    } );

    this.data.theaters = _sort( this.data.theaters, theater => {
      return theater.infos.nextShowTime ? theater.infos.nextShowTime.value : Infinity;
    } );
  }

  ready (){
    this.setTitle( this.data.name );
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      content: this.el.querySelector( '.screen-content' )
    };

    if( this.data.theaters ){
      this.tabs = new Tablist( this.el.querySelector( '[role=tablist]' ), {
        openTab: this.scrollTop
      } );
    }
  }

  renderError (){

    this.els.content.innerHTML = this.errorDom( {
      title: '“What we have here is a failure to communicate”',
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
