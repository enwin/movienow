'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/movies.jade';
import domList from '../../page/view/movies-list.jade';
import router from '../module/router';

import _sortBy from 'lodash/sortBy';
import _extend from 'lodash/extend';

import user from '../data/user';

class Movies extends Screen {

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleTyping.bind( this ) );
  }

  displayed ( params ){
    if(params.filter !== this.datas.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.datas.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      this.els.filter.value = this.datas.screenParams.filter;
      // filter
      this.handleFilter();
    }

    if( this.datas.location !== user.location ){
      this.datas.location = user.location;
      this.els.list.innerHTML = '';
      this.getData();
    }
  }

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-movies screen-list'
    };
  }

  handleFilter (){
    var filterValue;

    if( !this.datas.allMovies ){
      return;
    }

     filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      this.datas.movies = this.datas.allMovies.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.datas.movies = this.datas.allMovies;
    }

    this.renderList();
  }

  handleTyping ( e ){
    var filter = e.currentTarget.value.trim(),
        url = [ '/movies' ];

    if( filter.length ){
      url.push( `filter=${filter.toLowerCase()}` );
    }

    router.navigate( {}, '', url.join('?'), true );
  }

  initialize (){
    this.datas.location = user.location;

    this.bind();
    this.getData();
    this.setTitle( 'Movies' );
    this.render();
  }

  getData (){
    this.sync( [ '/api/movies', this.datas.location.toLowerCase() ].join('/') )
      .catch( e => console.log( e ) )
      .then( () => this.ready() );
  }

  parse (datas){
    datas = _sortBy( datas, 'name' );

    return _extend( this.datas, {
      allMovies: datas,
      movies: datas
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
  return new Movies( args );
};
