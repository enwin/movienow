'use-strict'

import Screen from './screen';
import moment from 'moment';
import view from '../../page/view/theater.jade';
import _sort from 'lodash/sortBy';
import _extend from 'lodash/extend';

class Theater extends Screen {

  dom() {
    return {
      tagName: 'section',
      id: 'theater',
      className: 'screen screen-theater'
    };
  }

  initialize (){
    this.getData();

    this.render();
  }

  getData (){
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
  }
}



export default ( args ) => {
  return new Theater( args );
};
