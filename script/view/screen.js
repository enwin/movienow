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

  setTitle ( title ){
    this._screenTitle = title;
    document.title = title.length ? [ title, 'Movie now!' ].join(' | ') : 'Movie now!';
  }

  show (){
    if( !main.contains( this.el ) ){
      main.appendChild( this.el );
    }
    // if the screen has a title stored, set it
    if( this._screenTitle ){
      this.setTitle( this._screenTitle );
    }
  }

  sync ( url, params ){
    return window.fetch( url, params || {} ).then( r => r.json() )
        .then( data => this.parse( data ) );

  }
}

export default Screen;
