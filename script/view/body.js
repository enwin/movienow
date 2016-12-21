import bind from '../helper/bind';

class body {
  constructor (){
    this.els = {
      header: document.querySelector( '.site-header' )
    };
    this.bind();
  }

  bind (){
    bind( this.els.header, 'click', '.button-back', this.goBack.bind( this ) );
  }

  goBack ( e ){
    window.history.back();
  }

  handleSiteHeader ( routeName, params ){
    this.els.header.classList.toggle( 'header-small', routeName !== 'home' );
    this.els.header.classList.toggle( 'header-back', ( routeName !== 'home' && !!params.id ) || routeName === 'credits' );
  }
}

export default new body();
