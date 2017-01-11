import bind from '../helper/bind';

class Body {
  constructor (){
    this.els = {
      header: document.querySelector( '.site-header' )
    };
    this.bind();
  }

  bind (){
    bind( this.els.header, 'click', '.button-back', this.goBack.bind( this ) );
    bind( document.body, 'click', '.button-restart', this.restart.bind( this ) );
  }

  goBack (){
    window.history.back();
  }

  handleSiteHeader ( routeName, params ){
    this.els.header.classList.toggle( 'header-small', routeName !== 'home' );
    this.els.header.classList.toggle( 'header-back', ( routeName !== 'home' && !!params.id ) || routeName === 'credits' );
  }

  restart (){
    window.location.href = '/';
  }
}

export default new Body();
