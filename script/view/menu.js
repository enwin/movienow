import dom from '../../page/view/menu.jade';
import bind from '../helper/bind';

var datas = {
  screens: {
    'home': {
      link: '/',
      name: 'Home'
    },
    'theaters': {
      link: '/theaters',
      name: 'Theaters'
    },
    'movies': {
      'link': '/movies',
      'name': 'Movies'
    }
  },
  favorites: {
    'ad3f3f5dcb802009': {
      link: '/theaters/ad3f3f5dcb802009',
      name: 'Le Louxor'
    },
    '37d0682253c6f94d': {
      link: '/theaters/37d0682253c6f94d',
      name: 'UGC Ciné-Cité Bercy'
    }
  }
};

class Menu {
  constructor (){
    this.el = document.querySelector( '.site-menu' );

    this.els = {
      button: document.querySelector( '.site-menu-button' ),
      list: this.el.querySelector( '.menu-wrapper' )
    };

    this.datas = datas;

    this.bind();

    this.render();
  }

  bind (){
    bind( this.el, 'click', 'a[href^="/"]', (e) => this.setClose(e) );
    bind( this.el, 'transitionend', (e) => this.handleAnimation(e) );
    bind( this.els.button, 'click', (e) => this.toggle(e) );
  }

  handleAnimation (){
    this.el.style.display = '';
  }

  render (){
    this.els.list.innerHTML = dom( this.datas );
  }

  setClose (){
    this.datas.renderClose = true;
  }

  setCurrent ( current, params ){
    // search for current theater in the favorite list and fallback otherwise
    if( this.datas.favorites && params && params.id && this.datas.favorites[ params.id ] ){
      this.datas.current = params.id;
    }
    else{
      this.datas.current = current;
    }
    this.render();

    if( this.datas.renderClose ){
      this.datas.renderClose = false;
      this.toggle();
    }
  }

  toggle (){
    var isOpen = !this.el.attributes[ 'aria-hidden' ];

    this.el.style.display = 'block';

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        this.el[ isOpen ? 'setAttribute' : 'removeAttribute' ]( 'aria-hidden', isOpen );
      } );

    }, 16 );
  }
}

export default new Menu();
