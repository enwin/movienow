import loader from '../module/loader';
import _extend from 'lodash/extend';
import moment from 'moment';
import errorDialog from './error';
import bind from '../helper/bind';
import domMessage from '../../page/view/message.jade';
import user from '../data/user';
import router from '../module/router';

var main = document.getElementById( 'main' );

// check visibility api
var visibility = [ { name: 'hidden', event:'visibilitychange' }, { name: 'mozHidden', event:'mozvisibilitychange' }, { name: 'msHidden', event:'msvisibilitychange' }, { name: 'webkitHidden', event:'webkitvisibilitychange' } ].find( api => {
  return api.name in document;
} );

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

    this.errorDom = domMessage;


    bind( this.el, 'click', '.button-refresh', () => this.getData() );

    // refresh current screen when screen is visible
    document.addEventListener( visibility.event, () => {
      if( document[ visibility.name ] && this.data.screenParams.visible && this.displayed ){
        this.displayed( this._displayParams );
      }
    } );

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

  renderError ( err ){
    errorDialog.show( err );
  }

  setTitle ( title ){
    this._screenTitle = title;
    document.title = title.length ? [ title, 'Movie now!' ].join(' | ') : 'Movie now!';

    if( window._paq ){
      window._paq.push(['setCustomUrl', window.location.href ]);
      window._paq.push(['setDocumentTitle', document.title]);
      window._paq.push(['trackPageView']);
    }
  }

  show ( params ){

    this._displayParams = params;

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
    if( !user.ready && this.el.id !== 'around' ){
      return router.screens.around.polite()
        .then( () => {
          if( user.ready ){
            this.getData();
          }
          else{
            this.renderError();
          }
        } );
    }

    loader.show( this.el.id === 'around' && !document.getElementById( 'locationDialog' ).hasAttribute( 'aria-hidden' ) && document.getElementById( 'locationDialog' ) );

    params = params || {};

    var dayOfYear = moment().format( 'DDD' );

    url += `?day=${dayOfYear}`;

    this.data.screenParams.fetchedDay = dayOfYear;

    params.credentials = 'same-origin';

    Object.assign( params.headers || {}, {
      'accept-language': navigator.language
    } );

    return window.fetch( url, params ).then( r => r.json() )
      .then( data => {
        if( data.error ){
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
        loader.hide();
        this.renderError( err );
      } );

  }
}

export default Screen;
