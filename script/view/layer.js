import bind from '../helper/bind';

class Layer{
  constructor (){
    this.bind();
  }

  bind (){
    bind( document.body, 'click', '.layer a[href^="/"], .layer-close', (e) => this.close(e) );
    bind( document.body, 'click', '.layer', (e) => this.handleLayerClick(e) );
    bind( document.body, 'transitionend', '.layer', (e) => this.handleAnimation(e) );
    bind( document.body, 'click', '.layer-control[aria-controls]', (e) => this.handleControls(e) );
  }

  handleAnimation ( e ){
    if( e.target.classList.contains( '.layer' ) ){
      e.target.style.display = '';

    }
  }

  close (){
    if( this.layer ){
      this.toggle( this.layer );
    }
  }

  handleControls ( e ){
    var button = e.currentTarget,
        layer = button.controls;

    if( !button.controls ){
      layer = button.controls = document.getElementById( button.getAttribute( 'aria-controls' ) );
    }

    this.toggle( layer );

  }

  handleLayerClick ( e ){
    if( e.target.classList.contains( 'layer' ) ){
      this.close();
    }
  }

  /**
   * display a specified layer
   * @param  {string} layer id of the layer to display
   */
  show ( layer, onClose ){
    // close the currentLayer
    this.close();

    if( layer === 'menu' ){
      document.querySelector( `[aria-controls=${layer}]` ).click();
      return;
    }

    layer = document.getElementById( layer );

    layer.onClose = onClose;

    this.toggle( layer );
  }

  toggle ( layer ){

    var open = layer.hasAttribute( 'aria-hidden' );

    layer.style.display = 'block';

    if( !open ){
      delete this.layer;
    }
    else{
      this.layer = layer;
    }

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        layer[ open ? 'removeAttribute' : 'setAttribute' ]( 'aria-hidden', !open );
        if( layer.onClose && !open ){
          layer.onClose();
          delete layer.onClose;
        }
      } );
    }, 16 );

    Array.prototype.forEach.call( document.querySelectorAll( '[aria-controls='+layer.id+']' ), button => {
      button.setAttribute( 'aria-expanded', open );
    } );
  }

}

export default new Layer();
