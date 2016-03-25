import view from '../../page/module/loader.jade';

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
      document.body.removeChild( this.el );
    }
  }

  show (){
    document.body.appendChild( this.el );
    window.setTimeout( () => {
      window.requestAnimationFrame( () => this.display() );
    }, 16 );
  }
}
window.loader = new Loader();
export default window.loader;
