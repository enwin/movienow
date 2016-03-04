'use-strict'

import favList from '../data/favorites';

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/favorites.jade';
import domList from '../../page/view/favorites-list.jade';
import router from '../module/router';

class Favorites extends Screen {

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleTyping.bind( this ) );
    bind( this.el, 'click', '.button-favorite', this.removeFavorite.bind( this ) );
  }

  displayed ( params ){
    this.getData();

    if(params.filter !== this.datas.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.datas.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      this.els.filter.value = this.datas.screenParams.filter;
      // filter
      this.handleFilter();
    }
    else{
      this.renderList();
    }

  }

  dom() {
    return {
      tagName: 'section',
      className: 'screen screen-favorites screen-list'
    };
  }

  getData (){
    this.datas.allFavorites = favList.list();
    this.datas.favorites = this.datas.allFavorites.slice();
  }

  handleFilter (){
    var filterValue;

    if( !this.datas.allFavorites ){
      return;
    }

     filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      this.datas.favorites = this.datas.allFavorites.filter( favorite => favorite.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.datas.favorites = this.datas.allFavorites;
    }

    this.renderList();
  }

  handleTyping ( e ){
    var filter = e.currentTarget.value.trim(),
        url = [ '/favorites' ];

    if( filter.length ){
      url.push( `filter=${filter.toLowerCase()}` );
    }

    router.navigate( {}, '', url.join('?'), true );
  }

  initialize (){
    this.setTitle( 'Favorites' );
    this.getData();
    this.render();
    this.bind();
    this.handleFilter();
  }

  removeFavorite ( e ){
    var theaterId = e.currentTarget.dataset.id;

    favList.remove( {
      id: theaterId
    } );

    this.getData();
    this.renderList();
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
  return new Favorites( args );
};
