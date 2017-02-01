import favList from '../data/favorites';

import bind from '../helper/bind';
import Screen from './screen';
import view from '../../page/view/favorites.pug';
import domList from '../../page/view/favorites-list.pug';
import router from '../module/router';

class Favorites extends Screen {

  bind (){
    bind( this.el, 'input', 'input[type=search]', this.handleTyping.bind( this ) );
    bind( this.el, 'click', '.button-favorite', this.removeFavorite.bind( this ) );
    bind( this.el, 'click', 'a[data-id]', this.routeData.bind( this ) );
  }

  displayed ( params ){
    this.getData();

    if(params.filter !== this.data.screenParams.filter ){
      // update the current screenParam filter to either the value of filter or empty if undefined
      this.data.screenParams.filter = params.filter ? params.filter : '';
      // update the input
      this.els.filter.value = this.data.screenParams.filter;
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
    this.data.allFavorites = favList.list();
    this.data.favorites = this.data.allFavorites.slice();
  }

  handleFilter (){
    var filterValue;

    if( !this.data.allFavorites ){
      return;
    }

     filterValue = this.els.filter.value.trim().toLowerCase();

    if( filterValue.length ){
      this.data.favorites = this.data.allFavorites.filter( favorite => favorite.name.toLowerCase().indexOf( filterValue ) > -1 );
    }
    else{
      this.data.favorites = this.data.allFavorites;
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
    this.el.innerHTML = view( this.data );
    this.els = {
      list: this.el.querySelector( '.screen-content' ),
      filter: this.el.querySelector( '.screen-form input' )
    };
  }

  renderList (){
    this.els.list.innerHTML = domList( this.data );
  }

  routeData ( e ){
    var selectedId = e.currentTarget.dataset.id;

    router.setData( this.data.favorites.find( favorite => favorite.id === selectedId ) );
  }
}

export default ( args ) => {
  return new Favorites( args );
};
