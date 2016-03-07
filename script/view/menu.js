import dom from '../../page/view/menu.jade';
import bind from '../helper/bind';
import favList from '../data/favorites';

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
    this.el = document.querySelector( '.site-menu' );

    this.els = {
      list: this.el.querySelector( '.menu-wrapper' )
    };

    this.datas = datas;

    this.bind();

    this.getFavs();

    this.render();
  }

  bind (){
    bind( this.el, 'click', 'a[href^="/"]', (e) => this.setClose(e) );
    bind( this.el, 'transitionend', (e) => this.handleAnimation(e) );
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

  }

  setClose (){
    //this.datas.renderClose = true;
    this.toggle();
  }

  // setCurrent ( current, params ){
  //   // search for current theater in the favorite list and fallback otherwise
  //   if( this.datas.favorites && params && params.id && this.datas.favorites[ params.id ] ){
  //     this.datas.current = params.id;
  //   }
  //   else{
  //     this.datas.current = current;
  //   }

  //   this.render();

  //   if( this.datas.renderClose ){
  //     this.datas.renderClose = false;
  //     this.toggle();
  //   }
  // }

  toggle (){
    var isOpen = !this.el.attributes[ 'aria-hidden' ];

    this.el.style.display = 'block';

    if( !isOpen ){
      this.updateFavIcon();
    }

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        this.el[ isOpen ? 'setAttribute' : 'removeAttribute' ]( 'aria-hidden', isOpen );
      } );
    }, 16 );

    this.els.buttons.forEach( button => {
      button.setAttribute( 'aria-expanded', !isOpen );
    } );
  }

  updateFavIcon (){
    this.getFavs();
    this.els.favorites.classList.toggle( 'empty', !this.datas.asFavorites );
  }
}

export default new Menu();
