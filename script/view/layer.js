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

    let layer = e.target;

    if( layer.classList.contains( 'layer' ) ){
      layer.style.display = '';
    }

    if( e.propertyName === 'transform' && e.target.classList.contains( 'layer-wrapper' ) ){
      layer = e.target.parentNode;

      if( layer.isOpen ){
        layer.focus();
      }

      return;
    }

    if( e.propertyName === 'background-color'&& !layer.isOpen && layer.onClose ){
      layer.onClose();
      delete layer.isOpen;
      delete layer.onClose;
      return;
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

    var closed = layer.getAttribute( 'aria-hidden' ) === 'true';

    // future state of the layer is the current state of the closed boolean
    layer.isOpen = closed;

    layer.style.display = 'block';

    if( !closed ){
      layer.removeAttribute( 'tabindex' );
      delete this.layer;
    }
    else{
      layer.setAttribute( 'tabindex', -1 );
      this.layer = layer;
    }

    window.setTimeout( () => {
      window.requestAnimationFrame( () => {
        layer.setAttribute( 'aria-hidden', !closed );
      } );
    }, 16 );

    Array.prototype.forEach.call( document.querySelectorAll( '[aria-controls='+layer.id+']' ), button => {
      button.setAttribute( 'aria-expanded', open );
    } );
  }

}

export default new Layer();
