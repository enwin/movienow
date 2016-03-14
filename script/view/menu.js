import user from '../data/user';
import favList from '../data/favorites';

import dom from '../../page/view/menu.jade';
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

    this.datas = datas;

    this.datas.location = user.location;

    this.bind();

    this.getFavs();

    this.render();
  }

  bind (){
    bind( document.body, 'click', '[aria-controls="menu"]', (e) => this.toggle(e) );
  }

  getFavs (){
    this.datas.asFavorites = !!favList.list().length;
  }

  handleAnimation (){
    this.el.style.display = '';
  }

  render (){
    this.els.list.innerHTML = dom( this.datas );

    this.els.buttons = Array.prototype.slice.call( document.querySelectorAll( '[aria-controls="menu"]' ) );
    this.els.favorites = this.el.querySelector( '.menu-favorites' );
    this.els.location = this.el.querySelector( '.menu-location-city' );

  }

  toggle (){
    var open = this.el.hasAttribute( 'aria-hidden' );

    if( open ){
      this.updateFavIcon();
      this.updateLocation();
    }
  }

  updateFavIcon (){
    this.getFavs();
    this.els.favorites.classList.toggle( 'empty', !this.datas.asFavorites );
  }

  updateLocation (){
    this.els.location.innerHTML = user.location.city.long;
  }
}

export default new Menu();
