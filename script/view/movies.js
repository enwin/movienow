'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/movies.jade';
import domList from '../../page/view/movies-list.jade';

import _sortBy from 'lodash/sortBy';

class Home extends Screen {

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-movies screen-list'
    };
  }

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleFilter.bind( this ) );
  }

  handleFilter ( e ){
    var filterValue;

    if( !this.datas.allMovies ){
      return;
    }

     filterValue = e.currentTarget.value.trim().toLowerCase();

    if( filterValue.length ){
      this.datas.movies = this.datas.allMovies.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.datas.movies = this.datas.allMovies;
    }

    this.renderList();
  }

  initialize (){
    this.bind();
    this.getData();
    this.setTitle( 'Movies' );
    this.render();
  }

  getData (){
    this.sync( '/api/movies' )
      .then( () => this.ready() )
      .catch( e => console.log( e ) );
  }

  parse (datas){
    datas = _sortBy( datas, (movie) => movie.name.toLowerCase() );

    return this.datas = {
      allMovies: datas,
      movies: datas
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
