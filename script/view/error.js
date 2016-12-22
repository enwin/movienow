import bind from '../helper/bind';
import dom from '../../page/view/error.pug';

class error {
  constructor (){
    this.el = document.createElement( 'section' );
    this.el.id = "errorDialog";
    this.el.className = 'error-dialog';
    this.el.setAttribute( 'role', 'alertdialog' );
    this.el.setAttribute( 'aria-describedby', 'errorMessage' );
    this.el.setAttribute( 'aria-hidden', 'true' );

    this.bind();
  }

  bind (){
    bind( document.body, 'click', '.error-dialog button', this.close.bind( this ) );
    bind( document.body, 'click', '.error-dialog', this.handleLayerClick.bind( this ) );
    bind( document.body, 'transitionend', '.error-dialog', this.handleAnimation.bind( this ) );
  }

  close (){
    this.toggle();
  }

  handleAnimation ( e ){
    if( e.target.classList.contains( '.error-dialog' ) ){
      e.target.style.display = '';
    }
  }

  handleLayerClick ( e ){
    if( e.target === this.el ){
      this.close();
    }
  }

  render ( error ){
    this.el.innerHTML = dom( error );
  }

  show ( error ){
    this.render( error );
    document.body.appendChild( this.el );
    this.toggle();
  }

  toggle (){

    var open = this.el.hasAttribute( 'aria-hidden' );

    this.el.style.display = 'block';

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        this.el[ open ? 'removeAttribute' : 'setAttribute' ]( 'aria-hidden', !open );
      } );
    }, 16 );

    Array.prototype.forEach.call( document.querySelectorAll( '[aria-controls=errorDialog]' ), button => {
      button.setAttribute( 'aria-expanded', open );
    } );
  }
}

export default new error();
