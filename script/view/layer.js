import bind from '../helper/bind';

class Layer{
  constructor (){
    this.bind();
  }

  bind (){
    bind( document.body, 'click', '.layer a[href^="/"], .layer-close', (e) => this.close(e) );
    bind( document.body, 'transitionend', '.layer', (e) => this.handleAnimation(e) );
    bind( document.body, 'click', '.layer-control[aria-controls]', (e) => this.handleControls(e) );
  }

  handleAnimation ( e ){
    if( e.target.classList.contains( '.layer' ) ){
      e.target.style.display = '';

    }
  }

  close (){
    //this.datas.renderClose = true;
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

    this.layer = layer;

    this.toggle( layer );

  }
  /**
   * display a specified layer
   * @param  {string} layer id of the layer to display
   */
  show ( layer ){
    // close the currentLayer
    this.close();

    // try to find an element who controls the layer
    var buttonForLayer = document.querySelector( `[aria-controls=${layer}]` );
    // to trigger a click on it
    if( buttonForLayer ){
      buttonForLayer.click();
    }
    // otherwise open the layer directly
    else{
      this.toggle(  document.getElementById( layer ) );
    }
  }

  toggle ( layer ){

    var open = layer.hasAttribute( 'aria-hidden' );

    layer.style.display = 'block';

    if( !open ){
      delete this.layer;
    }

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
