import view from '../../page/module/loader.pug';

class Loader{
  constructor (){
    this.el = document.createElement( 'div' );
    this.el.setAttribute( 'id', 'loader' );
    this.el.setAttribute( 'class', 'screen-loader' );

    this.el.innerHTML = view();

  }

  display (){
    this.el.classList.add( 'play' );
  }

  hide (){
    this.el.classList.remove( 'play' );
    this.remove();
  }

  remove (){
    if( this.el.parentNode ){
      this.el.parentNode.removeChild( this.el );
    }
  }

  show ( parent ){
    ( parent || document.body).appendChild( this.el );
    window.setTimeout( () => {
      window.requestAnimationFrame( () => this.display() );
    }, 16 );
  }
}
window.loader = new Loader();
export default window.loader;
