import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/movie.pug';
import _sort from 'lodash/sortBy';
import bind from '../helper/bind';
import localeTime from '../helper/localeDate';

import Tablist from '../helper/accedeweb-tablist';

import user from '../data/user';

class Movie extends Screen {

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

    this.render();

    this.bind();
  }

  getData (){

    if( !this.data.location ){
      this.ensureLocation();
      return;
    }

    if( this.els && this.els.content ){
      this.els.content.innerHTML = '';
    }

    this.sync( [ '/api/movies', this.data.location.country.short, this.data.location.zip.short, this.data.screenParams.id ].join('/') )
      .then( data => {
        if( !data ){
          return;
        }
        this.orderTheaters();
        this.ready();
      } );
  }

  orderTheaters (){
    var showtime,
        nextShowTime,
        nextShowTimeIndex,
        disabled,
        timeFormat = 'HH:mm';

    const now = moment(),
          localeFormat = { hour: 'numeric', minute: 'numeric' };

    this.data.theaters.forEach( theater => {

      theater.infos = {};
      nextShowTime = null;
      nextShowTimeIndex = null;

      theater.showtimes.forEach( ( types, showIndex ) => {
        types.times.forEach( time => {

          showtime = moment( time.original, 'HH:mm A' );

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

          time.disabled = disabled;
          time.value = showtime.format( 'YYYY-MM-DDTHH:mm' );
          time.formated = localeTime ? showtime.toDate().toLocaleTimeString( navigator.language, localeFormat) : showtime.format( timeFormat );
        } );
      } );
    } );

    this.data.theaters = _sort( this.data.theaters, theater => {
      return theater.infos.nextShowTime ? theater.infos.nextShowTime.value : Infinity;
    } );
  }

  ready (){
    this.setTitle( this.data.title );
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
  return new Movie( args );
};
