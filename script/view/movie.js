'use-strict'

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/movie.jade';
import _sort from 'lodash/sortBy';
import _extend from 'lodash/extend';

class Theater extends Screen {

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-movie'
    };
  }

  initialize (){
    this.getData();

    this.render();
  }

  getData (){
    this.sync( '/api/movies/'+this.datas.screenParams.id )
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
  }

  render (){
    this.el.innerHTML = view( this.datas );
  }
}

export default ( args ) => {
  return new Theater( args );
};
