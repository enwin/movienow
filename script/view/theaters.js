'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/theaters.jade';
import domList from '../../page/view/theaters-list.jade';

class Home extends Screen {

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-theaters screen-list'
    };
  }

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleFilter.bind( this ) );
  }

  handleFilter ( e ){
    var filterValue;

    if( !this.datas.allTheaters ){
      return;
    }

     filterValue = e.currentTarget.value.trim().toLowerCase();

    if( filterValue.length ){
      this.datas.theaters = this.datas.allTheaters.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.datas.theaters = this.datas.allTheaters;
    }

    this.renderList();
  }

  initialize (){
    this.bind();
    this.getData();
    this.setTitle( 'Theaters' );
    this.render();
  }

  getData (){
    this.sync( '/api/theaters' )
      .then( () => this.ready() )
      .catch( e => console.log( e ) );
  }

  parse (datas){
    return this.datas = {
      allTheaters: datas,
      theaters: datas
    };
  }

  ready (){
    this.render();
  }

  render (){
    this.el.innerHTML = view( this.datas );
    this.els = {
      list: this.el.querySelector( '.screen-content' )
    };
  }

  renderList (){
    this.els.list.innerHTML = domList( this.datas );
  }
}



export default ( ...args ) => {
  return new Home( args );
};
