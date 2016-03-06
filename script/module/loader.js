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
    document.body.removeChild( this.el );
  }

  show (){
    document.body.appendChild( this.el );
    window.requestAnimationFrame( () => this.display() );
  }
}

export default new Loader();
