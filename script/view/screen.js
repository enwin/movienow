var main = document.getElementById( 'main' );

class Screen {
  constructor ( args ){
    this.el = this._el( this.dom() );

    this.datas = args || {};

    // fix for browsersync using window.name
    if( !this.datas.name ){
      this.datas.name = '';
    }

    if( this.initialize ){
      this.initialize();
    }
  }

  _el ( params ){
    var el = document.createElement( params.tagName || 'div' );

    if( params.className ){
      el.setAttribute( 'class', params.className );
    }

    if( params.id ){
      el.setAttribute( 'id', params.id );
    }

    return el;
  }

  parse ( data ){
    return this.datas = data;
  }

  remove (){
    if( this.el.parentNode === main ){
      main.removeChild( this.el );
    }
  }

  show (){
    if( !main.contains( this.el ) ){
      main.appendChild( this.el );
    }
  }

  sync ( url, params ){
    return window.fetch( url, params || {} ).then( r => r.json() )
        .then( data => this.parse( data ) );

  }
}

export default Screen;
