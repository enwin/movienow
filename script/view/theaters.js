'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/theaters.jade';
import domList from '../../page/view/theaters-list.jade';
import router from '../module/router';

import _sortBy from 'lodash/sortBy';
import _extend from 'lodash/extend';

import user from '../data/user';

class Theaters extends Screen {

  bind (){
    bind( this.el, 'input', '.screen-header input', this.handleTyping.bind( this ) );
  }

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-theaters screen-list'
    };
  }

  displayed ( params ){
    var refresh;

    if( params.filter !== this.data.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.data.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      this.els.filter.value = this.data.screenParams.filter;
      // filter
      this.handleFilter();
    }

    if( params.search && 'true' === params.search ){
      router.navigate( {}, '', '/theaters', true );
      this.els.filter.focus();
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
  }

  handleFilter (){
    var filterValue;

    if( !this.data.allTheaters ){
      return;
    }

    filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      // sort theater by name only when filtering
      this.data.theaters = _sortBy( this.data.allTheaters.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 ), theater => theater.name.toLowerCase() );
    }
    else{
      this.data.theaters = this.data.allTheaters;
    }

    this.renderList();
  }

  handleTyping ( e ){
    var filter = e.currentTarget.value.trim(),
        url = [ '/theaters' ];

    if( filter.length ){
      url.push( `filter=${filter.toLowerCase()}` );
    }

    router.navigate( {}, '', url.join('?'), true );
  }

  initialize (){
    this.data.location = user.location;

    this.bind();
    this.getData();
    this.setTitle( 'Theaters' );
    this.render();
  }

  getData (){
    this.sync( [ '/api/theaters', this.data.location.city.slug ].join( '/') )
      .then( data => {
        if( !data ){
          return;
        }
        this.ready();
      } );
  }

  parse (datas){
    datas = _sortBy( datas, 'name' );

    return _extend( this.data, {
      allTheaters: datas,
      theaters: datas
    } );
  }

  ready (){
    this.handleFilter();
    this.renderList();
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      filter: this.el.querySelector( '.screen-form input' )
    };
  }

  renderList (){
    this.els.list.innerHTML = domList( this.data );
  }
}



export default ( args ) => {
  return new Theaters( args );
};
