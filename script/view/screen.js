import _extend from 'lodash/extend';

var main = document.getElementById( 'main' );

class Screen {
  constructor ( args ){
    this.el = this._el( this.dom() );

    this.datas = {
      screenParams: args
    };

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
    return _extend( this.datas, data );
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

  show ( params ){

    if( !main.contains( this.el ) ){
      main.appendChild( this.el );
    }

    // focus the new screen if focus is not in the screen
    if( document.activeElement && !this.el.contains( document.activeElement ) ){
      document.activeElement.blur();
      this.el.focus();
    }


    // if the screen has a title stored, set it
    if( this._screenTitle ){
      this.setTitle( this._screenTitle );
    }

    if( this.displayed ){
      this.displayed( params );
    }
  }

  sync ( url, params ){
    return window.fetch( url, params || {} ).then( r => r.json() )
        .then( data => this.parse( data ) );

  }
}

export default Screen;
