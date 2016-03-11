import bind from '../helper/bind';

class Layer{
  constructor (){
    this.bind();
  }

  bind (){
    bind( document.body, 'click', '.layer a[href^="/"], .layer-close', (e) => this.setClose(e) );
    bind( document.body, 'transitionend', '.layer', (e) => this.handleAnimation(e) );
    bind( document.body, 'click', '.layer-control[aria-controls]', (e) => this.handleControls(e) );
  }

  handleAnimation ( e ){
    if( e.target.classList.contains( '.layer' ) ){
      e.target.style.display = '';
    }
  }

  setClose (){
    //this.datas.renderClose = true;

    this.toggle( this.layer );
  }

  handleControls ( e ){
    var button = e.currentTarget,
        layer = button.controls;

    if( !button.controls ){
      layer = button.controls = document.getElementById( button.getAttribute( 'aria-controls' ) );
    }

    this.layer = layer;

    this.toggle( layer );

  }

  toggle ( layer ){

    var open = layer.hasAttribute( 'aria-hidden' );

    layer.style.display = 'block';

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        layer[ open ? 'removeAttribute' : 'setAttribute' ]( 'aria-hidden', !open );
      } );
    }, 16 );

    Array.prototype.forEach.call( document.querySelectorAll( '[aria-controls='+layer.id+']' ), button => {
      button.setAttribute( 'aria-expanded', open );
    } );
  }

}

export default new Layer();
