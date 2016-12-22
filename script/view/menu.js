import user from '../data/user';
import favList from '../data/favorites';

import dom from '../../page/view/menu.pug';
import bind from '../helper/bind';

var datas = {
  screens: {
    'home': {
      link: '/',
      name: 'Home'
    },
    'movies': {
      'link': '/movies',
      'name': 'Movies'
    },
    'theaters': {
      link: '/theaters',
      name: 'Theaters'
    }
  }
};

class Menu {
  constructor (){
    this.el = document.getElementById( 'menu' );

    this.els = {
      list: this.el.querySelector( '.layer-wrapper' )
    };

    this.data = datas;

    this.bind();

    this.getFavs();

    this.render();
  }

  bind (){
    bind( document.body, 'click', '[aria-controls="menu"]', (e) => this.toggle(e) );
  }

  getFavs (){
    this.data.asFavorites = !!favList.list().length;
  }

  render (){

    this.data.location = user.location;

    this.els.list.innerHTML = dom( this.data );

    this.els.buttons = Array.prototype.slice.call( document.querySelectorAll( '[aria-controls="menu"]' ) );
    this.els.favorites = this.el.querySelector( '.menu-favorites' );
    this.els.location = this.el.querySelector( '.menu-location-city' );

  }

  toggle (){
    var open = this.el.hasAttribute( 'aria-hidden' );

    if( open ){
      this.getFavs();
      this.render();
    }
  }
}

export default new Menu();
