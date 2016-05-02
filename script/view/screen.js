import loader from '../module/loader';
import _extend from 'lodash/extend';
import moment from 'moment';
import errorDialog from './error';

var main = document.getElementById( 'main' );

class Screen {
  constructor ( args ){
    this.el = this._el( this.dom() );

    args = args || {};
    args.visible = false;

    this.data = {
      screenParams: args
    };

    // fix for browsersync using window.name
    if( !this.data.name ){
      this.data.name = '';
    }

    if( this.initialize ){
      this.initialize();
    }
  }

  _el ( params ){

    if( params.el ){
      return params.el;
    }

    var el = document.createElement( params.tagName || 'div' );

    el.setAttribute( 'tabindex', -1 );

    if( params.className ){
      el.setAttribute( 'class', params.className );
    }

    if( params.id ){
      el.setAttribute( 'id', params.id );
    }

    return el;
  }

  newDay (){
    return moment().format( 'DDD' ) !== this.data.screenParams.fetchedDay;
  }

  parse ( data ){
    return _extend( this.data, data );
  }

  remove (){
    if( this.el.parentNode === main ){
      main.removeChild( this.el );
    }

    this.data.screenParams.visible = false;

    if( this.hidden ){
      this.hidden();
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

    this.data.screenParams.visible = true;

    if( this.displayed ){
      this.displayed( params );
    }
  }

  sync ( url, params ){
    loader.show();

    params = params || {};

    var dayOfYear = moment().format( 'DDD' );

    url += `?day=${dayOfYear}`;

    this.data.screenParams.fetchedDay = dayOfYear;

    params.credentials = 'same-origin';

    return window.fetch( url, params ).then( r => r.json() )
      .then( data => {
        if( data.error ){
          loader.hide();
          return Promise.reject( data.error );
        }
        return data;
      } )
      .then( data => this.parse( data ) )
      .then( data => {
        loader.hide();
        return data;
      } )
      .catch( err => {
        errorDialog.show( err );
      } );

  }
}

export default Screen;
