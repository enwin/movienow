'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/movies.pug';
import domList from '../../page/view/movies-list.pug';
import router from '../module/router';

import _sortBy from 'lodash/sortBy';
import _extend from 'lodash/extend';

import user from '../data/user';

class Movies extends Screen {

  bind (){
    bind( this.el, 'input', '.screen-header input', this.handleTyping.bind( this ) );
  }

  displayed ( params ){
    var refresh;

    if( params.filter !== this.data.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.data.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      if( this.els.filter.value !== this.data.screenParams.filter ){
        this.els.filter.value = this.data.screenParams.filter;
      }
      // filter
      this.handleFilter();
    }

    if( params.search && 'true' === params.search ){
      if( user.ready ){
        router.navigate( {}, '', '/movies', true );
        this.els.filter.focus();
      }
      else{
        this.onReady = function(){
          router.navigate( {}, '', '/movies', true );
          this.els.filter.focus();
        };
      }
    }

    if( this.data.location !== user.location ){
      this.data.location = user.location;
      refresh = true;
    }
    else if( this.newDay() ){
      refresh = true;
    }

    // console.log( 'refresh', refresh, this.data.location, user.location, this.newDay() );

    if( refresh ){
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

    if( !this.data.allMovies ){
      return;
    }

    filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      this.data.movies = this.data.allMovies.filter( (movie) => movie.title.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.data.movies = this.data.allMovies;
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
    this.data.location = user.location;

    this.bind();
    this.setTitle( 'Movies' );
    this.render();
  }

  getData (){

    if( !this.data.location ){
      this.ensureLocation();
      return;
    }

    if( this.els.list ){
      this.els.list.innerHTML = '';
    }

    this.sync( [ '/api/movies', this.data.location.country.short, this.data.location.zip.short ].join('/') )
      .then( data => {
        if( !data ){
          return;
        }
        this.ready();
      } );
  }

  parse (datas){
    datas = _sortBy( datas, 'title' );

    return _extend( this.data, {
      allMovies: datas,
      movies: datas
    } );
  }

  ready (){
    this.handleFilter();
    this.renderList();

    if( this.onReady ){
      this.onReady();
      delete this.onReady;
    }
  }

  render (){
    this.el.innerHTML = view( this.data );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      filter: this.el.querySelector( '.screen-form input' )
    };
  }

  renderError (){
    this.els.list.innerHTML = this.errorDom( {
      title: '“Houston, we have a problem”',
      link: {
        text: 'Try again',
        type: 'refresh'
      },
      icon: 'search',
      type: 'error-reversed'
    } );
  }

  renderList (){
    var html;

    if( this.data.movies.length ){
      html = domList( this.data );
    }
    else{
      html = this.errorDom( { data: {
        title: 'Bummer',
        text: 'There\'s no movie matching your search',
        icon: 'search',
        type: 'error-reversed'
      } } );
    }
    this.els.list.innerHTML = html;
  }
}

export default ( args ) => {
  return new Movies( args );
};
