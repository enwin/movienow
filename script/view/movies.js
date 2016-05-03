'use-strict'

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/movies.jade';
import domList from '../../page/view/movies-list.jade';
import domMessage from '../../page/view/message.jade';
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
      this.els.filter.value = this.data.screenParams.filter;
      // filter
      this.handleFilter();
    }

    if( params.search && 'true' === params.search ){
      router.navigate( {}, '', '/movies', true );
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
      this.data.movies = this.data.allMovies.filter( (theater) => theater.name.toLowerCase().indexOf( filterValue ) > -1 );
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
    this.getData();
    this.setTitle( 'Movies' );
    this.render();
  }

  getData (){
    this.sync( [ '/api/movies', this.data.location.city.slug ].join('/') )
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
      allMovies: datas,
      movies: datas
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
      html = domMessage( {
        title: 'Bummer',
        text: 'There\'s no movie matching your search',
        icon: 'search',
        type: 'error-reversed'
      } );
    }
    this.els.list.innerHTML = html;
  }
}

export default ( args ) => {
  return new Movies( args );
};
