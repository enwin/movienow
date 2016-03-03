'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/theaters.jade';
import domList from '../../page/view/theaters-list.jade';
import router from '../module/router';

import _extend from 'lodash/extend';

class Theaters extends Screen {

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleTyping.bind( this ) );
  }

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-theaters screen-list'
    };
  }

  displayed ( params ){
    if( params.filter !== this.datas.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.datas.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      this.els.filter.value = this.datas.screenParams.filter;
      // filter
      this.handleFilter();
    }
  }

  handleFilter (){
    var filterValue;

    if( !this.datas.allTheaters ){
      return;
    }

     filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      this.datas.theaters = this.datas.allTheaters.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.datas.theaters = this.datas.allTheaters;
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
    this.bind();
    this.getData();
    this.setTitle( 'Theaters' );
    this.render();
  }

  getData (){
    this.sync( '/api/theaters' )
      .catch( e => console.log( e ) )
      .then( () => this.ready() );
  }

  parse (datas){
    return _extend( this.datas, {
      allTheaters: datas,
      theaters: datas
    } );
  }

  ready (){
    this.handleFilter();
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      filter: this.el.querySelector( '.screen-form input' )
    };
  }

  renderList (){
    this.els.list.innerHTML = domList( this.datas );
  }
}



export default ( args ) => {
  return new Theaters( args );
};
